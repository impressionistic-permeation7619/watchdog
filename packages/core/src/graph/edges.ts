import {
  db,
  edgesRepo,
  evidenceLinksRepo,
  type EdgeListRow,
} from "@watchdog/db";
import {
  normalizeIdList,
  type ConfidenceTier,
  type EdgePredicate,
  type EntityKind,
} from "@watchdog/schemas";

import { assertEvidenceInCase } from "../evidence/evidence";
import { DomainError, isUniqueViolation } from "../infra/domain-error";
import { notifyEntityChanged } from "../infra/events";
import {
  applyValidatedEdgeUpdate,
  assertEdgeKindsAllowed,
  validateEdgeUpdate,
} from "./edge-update";
import { assertCaseExists, assertConfidenceEvidence, assertEntityInCase } from "./patch/guards";

const NATURAL_KEY_INDEX = "edges_natural_uidx";

export interface EdgeRecord {
  id: string;
  fromId: string;
  toId: string;
  predicate: EdgePredicate;
  confidence: ConfidenceTier;
  notes: string | null;
  evidenceIds: string[];
  /** Peer Entity for dossier display (the other end from this Entity). */
  peerId: string;
  peerName: string;
  peerSlug: string;
  peerKind: EntityKind;
  direction: "out" | "in";
}

export interface CreateEdgeInput {
  caseId: string;
  fromId: string;
  toId: string;
  predicate: EdgePredicate;
  confidence: ConfidenceTier;
  notes?: string;
  evidenceIds?: string[];
  /**
   * Entity whose dossier orientation to use on the returned record.
   * Defaults to `fromId`.
   */
  viewEntityId?: string;
}

export interface UpdateEdgeInput {
  caseId: string;
  edgeId: string;
  /**
   * Entity whose dossier orientation to use on the returned record.
   * Defaults to the edge's `fromId`.
   */
  viewEntityId?: string;
  /** Absolute endpoints (send both to change orientation or peer). */
  fromId?: string;
  toId?: string;
  predicate?: EdgePredicate;
  confidence?: ConfidenceTier;
  notes?: string;
  evidenceIds?: string[];
}

function toRecord(
  row: EdgeListRow,
  viewEntityId: string,
  evidenceIds: string[]
): EdgeRecord {
  const outbound = row.fromId === viewEntityId;
  return {
    id: row.id,
    fromId: row.fromId,
    toId: row.toId,
    predicate: row.predicate,
    confidence: row.confidence,
    notes: row.notes ?? null,
    evidenceIds,
    peerId: outbound ? row.toId : row.fromId,
    peerName: outbound ? row.toName : row.fromName,
    peerSlug: outbound ? row.toSlug : row.fromSlug,
    peerKind: outbound ? row.toKind : row.fromKind,
    direction: outbound ? "out" : "in",
  };
}

export async function listEdgesForEntity(
  caseId: string,
  entityId: string
): Promise<EdgeRecord[]> {
  await assertEntityInCase(caseId, entityId, db);
  const rows = await edgesRepo.listForEntity(db, caseId, entityId);
  const byEdge = await evidenceLinksRepo.listForEdges(
    db,
    rows.map((r) => r.id)
  );
  return rows.map((row) => toRecord(row, entityId, byEdge.get(row.id) ?? []));
}

/** Case-wide edge — absolute endpoints (no peer/direction). */
export interface CaseEdgeRecord {
  id: string;
  fromId: string;
  fromName: string;
  fromSlug: string;
  fromKind: EntityKind;
  toId: string;
  toName: string;
  toSlug: string;
  toKind: EntityKind;
  predicate: EdgePredicate;
  confidence: ConfidenceTier;
  notes: string | null;
  evidenceIds: string[];
}

export function toCaseEdgeRecord(
  row: EdgeListRow,
  evidenceIds: string[]
): CaseEdgeRecord {
  return {
    id: row.id,
    fromId: row.fromId,
    fromName: row.fromName,
    fromSlug: row.fromSlug,
    fromKind: row.fromKind,
    toId: row.toId,
    toName: row.toName,
    toSlug: row.toSlug,
    toKind: row.toKind,
    predicate: row.predicate,
    confidence: row.confidence,
    notes: row.notes ?? null,
    evidenceIds,
  };
}

export async function listEdgesForCase(
  caseId: string
): Promise<CaseEdgeRecord[]> {
  await assertCaseExists(caseId);
  const rows = await edgesRepo.listForCase(db, caseId);
  const byEdge = await evidenceLinksRepo.listForEdges(
    db,
    rows.map((r) => r.id)
  );
  return rows.map((row) => toCaseEdgeRecord(row, byEdge.get(row.id) ?? []));
}

export async function createEdge(input: CreateEdgeInput): Promise<EdgeRecord> {
  if (input.fromId === input.toId) {
    throw new DomainError("invalid", "Edge cannot link an Entity to itself");
  }

  const viewEntityId = input.viewEntityId ?? input.fromId;
  if (viewEntityId !== input.fromId && viewEntityId !== input.toId) {
    throw new DomainError(
      "invalid",
      "viewEntityId must be an endpoint of the Edge"
    );
  }

  const trimmedNotes = input.notes?.trim();
  if (
    input.predicate === "related_to" &&
    (trimmedNotes === undefined || trimmedNotes === "")
  ) {
    throw new DomainError("invalid", "related_to requires notes");
  }

  const evidenceIds = normalizeIdList(input.evidenceIds ?? []);
  assertConfidenceEvidence(input.confidence, evidenceIds);

  try {
    const created = await db.transaction(async (tx) => {
      await assertEntityInCase(input.caseId, input.fromId, tx);
      await assertEntityInCase(input.caseId, input.toId, tx);
      await assertEdgeKindsAllowed(
        input.caseId,
        input.fromId,
        input.toId,
        input.predicate,
        tx
      );
      await assertEvidenceInCase(input.caseId, evidenceIds, tx);

      const row = await edgesRepo.create(tx, {
        fromId: input.fromId,
        toId: input.toId,
        predicate: input.predicate,
        confidence: input.confidence,
        notes: input.notes ?? null,
      });
      if (!row) throw new DomainError("invalid", "Failed to create Edge");
      await evidenceLinksRepo.linkEdge(tx, row.id, evidenceIds);
      return row;
    });

    const listed = await edgesRepo.getListedInCase(
      db,
      input.caseId,
      created.id
    );
    if (!listed) throw new DomainError("invalid", "Edge created but not found");

    notifyEntityChanged(input.caseId);
    return toRecord(listed, viewEntityId, evidenceIds);
  } catch (error) {
    if (isUniqueViolation(error, NATURAL_KEY_INDEX)) {
      throw new DomainError("conflict", "That Edge already exists");
    }
    throw error;
  }
}

export async function updateEdge(
  input: UpdateEdgeInput
): Promise<EdgeRecord> {
  const existing = await edgesRepo.getInCase(db, input.caseId, input.edgeId);
  if (!existing) {
    throw new DomainError("not_found", "Edge not found in this Case");
  }

  const byEdge = await evidenceLinksRepo.listForEdges(db, [existing.id]);
  const evidenceIds = byEdge.get(existing.id) ?? [];

  try {
    const { listed, evidenceIds: nextEvidenceIds } = await db.transaction(
      async (tx) => {
        let nextIds = evidenceIds;
        if (input.evidenceIds !== undefined) {
          nextIds = normalizeIdList(input.evidenceIds);
          await assertEvidenceInCase(input.caseId, nextIds, tx);
          nextIds = await evidenceLinksRepo.replaceEdge(
            tx,
            existing.id,
            nextIds
          );
        }

        const validated = validateEdgeUpdate(input, existing, nextIds);
        const listedRow = await applyValidatedEdgeUpdate(tx, input, validated);
        return { listed: listedRow, evidenceIds: nextIds };
      }
    );

    const viewEntityId = input.viewEntityId ?? existing.fromId;
    notifyEntityChanged(input.caseId);
    return toRecord(listed, viewEntityId, nextEvidenceIds);
  } catch (error) {
    if (isUniqueViolation(error, NATURAL_KEY_INDEX)) {
      throw new DomainError("conflict", "That Edge already exists");
    }
    throw error;
  }
}

export async function deleteEdge(
  caseId: string,
  edgeId: string
): Promise<void> {
  const existing = await edgesRepo.getInCase(db, caseId, edgeId);
  if (!existing) {
    throw new DomainError("not_found", "Edge not found in this Case");
  }

  const deleted = await edgesRepo.delete(db, edgeId);
  if (!deleted) throw new DomainError("invalid", "Failed to delete Edge");

  notifyEntityChanged(caseId);
}
