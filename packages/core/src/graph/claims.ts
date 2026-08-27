import { claimsRepo, db, evidenceLinksRepo, type ClaimRow } from "@watchdog/db";
import type {
  ClaimClass,
  ConfidenceTier,
  RetractKind,
} from "@watchdog/schemas";
import { normalizeIdList } from "@watchdog/schemas";

import { assertEvidenceInCase } from "../evidence/evidence";
import { DomainError } from "../infra/domain-error";
import { notifyEntityChanged } from "../infra/events";
import { assertConfidenceEvidence, assertEntityInCase } from "./patch/guards";

export interface ClaimRecord {
  id: string;
  entityId: string;
  class: ClaimClass;
  text: string;
  confidence: ConfidenceTier;
  retracted: boolean;
  retractKind: RetractKind | null;
  retractedReason: string | null;
  retractedBy: string | null;
  retractedAt: string | null;
  evidenceIds: string[];
}

export interface CreateClaimInput {
  caseId: string;
  entityId: string;
  text: string;
  confidence: ConfidenceTier;
  class: ClaimClass;
  evidenceIds?: string[];
}

export interface UpdateClaimInput {
  caseId: string;
  claimId: string;
  text?: string;
  class?: ClaimClass;
  confidence?: ConfidenceTier;
  evidenceIds?: string[];
}

export interface RetractClaimInput {
  caseId: string;
  claimId: string;
  kind: RetractKind;
  reason: string;
}

function toRecord(row: ClaimRow, evidenceIds: string[]): ClaimRecord {
  return {
    id: row.id,
    entityId: row.entityId,
    class: row.class,
    text: row.text,
    confidence: row.confidence,
    retracted: row.retracted,
    retractKind: row.retractKind ?? null,
    retractedReason: row.retractedReason ?? null,
    retractedBy: row.retractedBy ?? null,
    retractedAt: row.retractedAt?.toISOString() ?? null,
    evidenceIds,
  };
}

type EntityListOpts = { includeRetracted?: boolean };

export async function listClaimsForEntity(
  caseId: string,
  entityId: string,
  opts?: EntityListOpts
): Promise<ClaimRecord[]> {
  await assertEntityInCase(caseId, entityId, db);
  const rows = await claimsRepo.listForEntity(db, entityId, opts);
  const byClaim = await evidenceLinksRepo.listForClaims(
    db,
    rows.map((r) => r.id)
  );
  return rows.map((row) => toRecord(row, byClaim.get(row.id) ?? []));
}

export async function createClaim(
  input: CreateClaimInput
): Promise<ClaimRecord> {
  const evidenceIds = normalizeIdList(input.evidenceIds ?? []);
  assertConfidenceEvidence(input.confidence, evidenceIds);

  const row = await db.transaction(async (tx) => {
    await assertEntityInCase(input.caseId, input.entityId, tx);
    await assertEvidenceInCase(input.caseId, evidenceIds, tx);

    const created = await claimsRepo.create(tx, {
      entityId: input.entityId,
      text: input.text,
      confidence: input.confidence,
      class: input.class,
    });
    if (!created) throw new DomainError("invalid", "Failed to create Claim");
    await evidenceLinksRepo.linkClaim(tx, created.id, evidenceIds);
    return created;
  });

  notifyEntityChanged(input.caseId);
  return toRecord(row, evidenceIds);
}

export async function retractClaim(
  input: RetractClaimInput,
  actorId: string
): Promise<ClaimRecord> {
  const existing = await claimsRepo.getInCase(db, input.caseId, input.claimId);
  if (!existing) throw new DomainError("not_found", "Claim not found");
  if (existing.retracted) {
    throw new DomainError("conflict", "Claim already retracted");
  }

  const row = await claimsRepo.retract(db, input.claimId, {
    retractKind: input.kind,
    retractedReason: input.reason,
    retractedBy: actorId,
  });
  if (!row) throw new DomainError("invalid", "Failed to retract Claim");

  const byClaim = await evidenceLinksRepo.listForClaims(db, [row.id]);
  notifyEntityChanged(input.caseId);
  return toRecord(row, byClaim.get(row.id) ?? []);
}

export async function updateClaim(
  input: UpdateClaimInput
): Promise<ClaimRecord> {
  const existing = await claimsRepo.getInCase(db, input.caseId, input.claimId);
  if (!existing) throw new DomainError("not_found", "Claim not found");

  const byClaim = await evidenceLinksRepo.listForClaims(db, [existing.id]);
  const evidenceIds = byClaim.get(existing.id) ?? [];

  if (
    input.text === undefined &&
    input.class === undefined &&
    input.confidence === undefined &&
    input.evidenceIds === undefined
  ) {
    throw new DomainError("invalid", "Nothing to update");
  }

  const { row, evidenceIds: nextEvidenceIds } = await db.transaction(
    async (tx) => {
      let nextIds = evidenceIds;
      if (input.evidenceIds !== undefined) {
        nextIds = normalizeIdList(input.evidenceIds);
        await assertEvidenceInCase(input.caseId, nextIds, tx);
        nextIds = await evidenceLinksRepo.replaceClaim(tx, existing.id, nextIds);
      }

      const nextConfidence = input.confidence ?? existing.confidence;
      assertConfidenceEvidence(nextConfidence, nextIds);

      const updated = await claimsRepo.update(tx, input.claimId, {
        ...(input.text === undefined ? {} : { text: input.text }),
        ...(input.class === undefined ? {} : { class: input.class }),
        ...(input.confidence === undefined
          ? {}
          : { confidence: input.confidence }),
      });
      if (!updated) throw new DomainError("invalid", "Failed to update Claim");
      return { row: updated, evidenceIds: nextIds };
    }
  );

  notifyEntityChanged(input.caseId);
  return toRecord(row, nextEvidenceIds);
}
