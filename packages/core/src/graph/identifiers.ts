import {
  db,
  evidenceLinksRepo,
  identifiersRepo,
  type IdentifierListRow,
  type IdentifierRow,
} from "@watchdog/db";
import type {
  ConfidenceTier,
  EntityKind,
  IdentifierStatus,
  IdentifierType,
} from "@watchdog/schemas";
import {
  normalizeIdList,
  validateIdentifierWrite,
} from "@watchdog/schemas";

import { assertEvidenceInCase } from "../evidence/evidence";
import { DomainError, isUniqueViolation } from "../infra/domain-error";
import { notifyEntityChanged } from "../infra/events";
import { assertCaseExists, assertConfidenceEvidence, assertEntityInCase } from "./patch/guards";

const NATURAL_KEY_INDEX = "identifiers_natural_uidx";
const DUPLICATE_MESSAGE = "That Identifier already exists on this Entity";

export interface IdentifierRecord {
  id: string;
  entityId: string;
  type: IdentifierType;
  platform: string;
  value: string;
  confidence: ConfidenceTier;
  status: IdentifierStatus;
  notes: string | null;
  evidenceIds: string[];
}

export interface CreateIdentifierInput {
  caseId: string;
  entityId: string;
  type: IdentifierType;
  value: string;
  confidence: ConfidenceTier;
  platform?: string;
  status: IdentifierStatus;
  notes?: string;
  evidenceIds?: string[];
}

export interface UpdateIdentifierInput {
  caseId: string;
  identifierId: string;
  value?: string;
  platform?: string;
  type?: IdentifierType;
  status?: IdentifierStatus;
  confidence?: ConfidenceTier;
  notes?: string;
  evidenceIds?: string[];
}

function toRecord(row: IdentifierRow, evidenceIds: string[]): IdentifierRecord {
  return {
    id: row.id,
    entityId: row.entityId,
    type: row.type,
    platform: row.platform,
    value: row.value,
    confidence: row.confidence,
    status: row.status,
    notes: row.notes ?? null,
    evidenceIds,
  };
}

export async function listIdentifiersForEntity(
  caseId: string,
  entityId: string
): Promise<IdentifierRecord[]> {
  await assertEntityInCase(caseId, entityId, db);
  const rows = await identifiersRepo.listForEntity(db, entityId);
  const byId = await evidenceLinksRepo.listForIdentifiers(
    db,
    rows.map((r) => r.id)
  );
  return rows.map((row) => toRecord(row, byId.get(row.id) ?? []));
}

/** Identifier plus owning entity labels for case-wide lists. */
export interface CaseIdentifierRecord extends IdentifierRecord {
  entityName: string;
  entitySlug: string;
  entityKind: EntityKind;
}

export function toCaseIdentifierRecord(
  row: IdentifierListRow,
  evidenceIds: string[]
): CaseIdentifierRecord {
  return {
    ...toRecord(row, evidenceIds),
    entityName: row.entityName,
    entitySlug: row.entitySlug,
    entityKind: row.entityKind,
  };
}

export async function listIdentifiersForCase(
  caseId: string
): Promise<CaseIdentifierRecord[]> {
  await assertCaseExists(caseId);
  const rows = await identifiersRepo.listForCase(db, caseId);
  const byId = await evidenceLinksRepo.listForIdentifiers(
    db,
    rows.map((r) => r.id)
  );
  return rows.map((row) =>
    toCaseIdentifierRecord(row, byId.get(row.id) ?? [])
  );
}

export async function createIdentifier(
  input: CreateIdentifierInput
): Promise<IdentifierRecord> {
  const written = validateIdentifierWrite({
    type: input.type,
    value: input.value,
    platform: input.platform,
  });
  if (!written.ok) {
    throw new DomainError("invalid", written.message);
  }
  const { value, platform } = written;

  const evidenceIds = normalizeIdList(input.evidenceIds ?? []);
  assertConfidenceEvidence(input.confidence, evidenceIds);

  try {
    const row = await db.transaction(async (tx) => {
      await assertEntityInCase(input.caseId, input.entityId, tx);
      await assertEvidenceInCase(input.caseId, evidenceIds, tx);

      const created = await identifiersRepo.create(tx, {
        entityId: input.entityId,
        type: input.type,
        platform,
        value,
        confidence: input.confidence,
        status: input.status,
        notes: input.notes ?? null,
      });
      if (!created) throw new DomainError("invalid", "Failed to create Identifier");
      await evidenceLinksRepo.linkIdentifier(tx, created.id, evidenceIds);
      return created;
    });

    notifyEntityChanged(input.caseId);
    return toRecord(row, evidenceIds);
  } catch (error) {
    if (isUniqueViolation(error, NATURAL_KEY_INDEX)) {
      throw new DomainError("conflict", DUPLICATE_MESSAGE);
    }
    throw error;
  }
}

export async function updateIdentifier(
  input: UpdateIdentifierInput
): Promise<IdentifierRecord> {
  const existing = await identifiersRepo.getInCase(
    db,
    input.caseId,
    input.identifierId
  );
  if (!existing) throw new DomainError("not_found", "Identifier not found");

  if (
    input.value === undefined &&
    input.platform === undefined &&
    input.type === undefined &&
    input.status === undefined &&
    input.confidence === undefined &&
    input.notes === undefined &&
    input.evidenceIds === undefined
  ) {
    throw new DomainError("invalid", "Nothing to update");
  }

  const byIdExisting = await evidenceLinksRepo.listForIdentifiers(db, [
    existing.id,
  ]);
  const evidenceIds = byIdExisting.get(existing.id) ?? [];

  try {
    const { row, evidenceIds: nextEvidenceIds } = await db.transaction(
      async (tx) => {
        let nextIds = evidenceIds;
        if (input.evidenceIds !== undefined) {
          nextIds = normalizeIdList(input.evidenceIds);
          await assertEvidenceInCase(input.caseId, nextIds, tx);
          nextIds = await evidenceLinksRepo.replaceIdentifier(
            tx,
            existing.id,
            nextIds
          );
        }

        const nextConfidence = input.confidence ?? existing.confidence;
        assertConfidenceEvidence(nextConfidence, nextIds);

        const patch: Parameters<typeof identifiersRepo.update>[2] = {};
        if (
          input.value !== undefined ||
          input.type !== undefined ||
          input.platform !== undefined
        ) {
          const written = validateIdentifierWrite({
            type: input.type ?? existing.type,
            value: input.value ?? existing.value,
            platform: input.platform ?? existing.platform,
          });
          if (!written.ok) {
            throw new DomainError("invalid", written.message);
          }
          if (input.type !== undefined) patch.type = written.type;
          if (input.platform !== undefined) {
            patch.platform = written.platform;
          }
          if (
            input.value !== undefined ||
            input.type !== undefined ||
            written.value !== existing.value
          ) {
            patch.value = written.value;
          }
        }
        if (input.status !== undefined) patch.status = input.status;
        if (input.confidence !== undefined) {
          patch.confidence = input.confidence;
        }
        if (input.notes !== undefined) {
          patch.notes = input.notes.trim() || null;
        }

        if (Object.keys(patch).length === 0) {
          return { row: existing, evidenceIds: nextIds };
        }

        const updated = await identifiersRepo.update(
          tx,
          input.identifierId,
          patch
        );
        if (!updated) throw new DomainError("invalid", "Failed to update Identifier");
        return { row: updated, evidenceIds: nextIds };
      }
    );

    notifyEntityChanged(input.caseId);
    return toRecord(row, nextEvidenceIds);
  } catch (error) {
    if (isUniqueViolation(error, NATURAL_KEY_INDEX)) {
      throw new DomainError("conflict", DUPLICATE_MESSAGE);
    }
    throw error;
  }
}
