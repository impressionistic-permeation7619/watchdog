import {
  edgesRepo,
  entitiesRepo,
  type DbExec,
  type EdgeListRow,
} from "@watchdog/db";
import {
  edgePredicateAllowsKinds,
  type ConfidenceTier,
  type EdgePredicate,
} from "@watchdog/schemas";

import { DomainError } from "../infra/domain-error";
import { assertConfidenceEvidence, assertEntityInCase } from "./guards";
import type { UpdateEdgeInput } from "./edges";

export interface ValidatedEdgeUpdate {
  existing: NonNullable<Awaited<ReturnType<typeof edgesRepo.getInCase>>>;
  evidenceIds: string[];
  next: {
    fromId: string;
    toId: string;
    predicate: EdgePredicate;
    confidence: ConfidenceTier;
    notes: string | null;
  };
  endpointsChanged: boolean;
  predicateChanged: boolean;
}

export function validateEdgeUpdate(
  input: UpdateEdgeInput,
  existing: NonNullable<Awaited<ReturnType<typeof edgesRepo.getInCase>>>,
  evidenceIds: string[]
): ValidatedEdgeUpdate {
  if (
    input.entityId !== existing.fromId &&
    input.entityId !== existing.toId
  ) {
    throw new DomainError("invalid", "Entity is not an endpoint of this Edge");
  }

  const hasEndpoints =
    input.fromId !== undefined || input.toId !== undefined;
  if (hasEndpoints && (input.fromId === undefined || input.toId === undefined)) {
    throw new DomainError("invalid", "fromId and toId must be sent together");
  }

  if (
    !hasEndpoints &&
    input.predicate === undefined &&
    input.confidence === undefined &&
    input.notes === undefined &&
    input.evidenceIds === undefined
  ) {
    throw new DomainError("invalid", "Nothing to update");
  }

  const next = {
    fromId: input.fromId ?? existing.fromId,
    toId: input.toId ?? existing.toId,
    predicate: input.predicate ?? existing.predicate,
    confidence: input.confidence ?? existing.confidence,
    notes:
      input.notes === undefined
        ? (existing.notes ?? null)
        : input.notes.trim() || null,
  };

  assertConfidenceEvidence(next.confidence, evidenceIds);

  if (next.fromId === next.toId) {
    throw new DomainError("invalid", "Edge cannot link an Entity to itself");
  }
  if (input.entityId !== next.fromId && input.entityId !== next.toId) {
    throw new DomainError(
      "invalid",
      "Entity must remain an endpoint of this Edge"
    );
  }
  if (
    next.predicate === "related_to" &&
    (next.notes === null || next.notes === "")
  ) {
    throw new DomainError("invalid", "related_to requires notes");
  }

  const endpointsChanged =
    next.fromId !== existing.fromId || next.toId !== existing.toId;
  const predicateChanged = next.predicate !== existing.predicate;

  return {
    existing,
    evidenceIds,
    next,
    endpointsChanged,
    predicateChanged,
  };
}

export async function assertEdgeKindsAllowed(
  caseId: string,
  fromId: string,
  toId: string,
  predicate: EdgePredicate,
  exec: DbExec
): Promise<void> {
  const from = await entitiesRepo.getInCase(exec, caseId, fromId);
  const to = await entitiesRepo.getInCase(exec, caseId, toId);
  if (!from || !to) {
    throw new DomainError("not_found", "Entity not found in this Case");
  }
  if (!edgePredicateAllowsKinds(predicate, from.kind, to.kind)) {
    throw new DomainError(
      "invalid",
      `${predicate} is not allowed for ${from.kind} → ${to.kind}`
    );
  }
}

export function buildEdgePatch(
  existing: NonNullable<Awaited<ReturnType<typeof edgesRepo.getInCase>>>,
  next: ValidatedEdgeUpdate["next"]
): Parameters<typeof edgesRepo.update>[2] {
  const patch: Parameters<typeof edgesRepo.update>[2] = {};
  if (next.fromId !== existing.fromId) patch.fromId = next.fromId;
  if (next.toId !== existing.toId) patch.toId = next.toId;
  if (next.predicate !== existing.predicate) {
    patch.predicate = next.predicate;
  }
  if (next.confidence !== existing.confidence) {
    patch.confidence = next.confidence;
  }
  if (next.notes !== (existing.notes ?? null)) {
    patch.notes = next.notes;
  }
  return patch;
}

export async function applyValidatedEdgeUpdate(
  tx: DbExec,
  input: UpdateEdgeInput,
  validated: ValidatedEdgeUpdate
): Promise<EdgeListRow> {
  const { existing, next, endpointsChanged, predicateChanged } = validated;

  if (endpointsChanged) {
    await assertEntityInCase(input.caseId, next.fromId, tx);
    await assertEntityInCase(input.caseId, next.toId, tx);
  }
  if (endpointsChanged || predicateChanged) {
    await assertEdgeKindsAllowed(
      input.caseId,
      next.fromId,
      next.toId,
      next.predicate,
      tx
    );
  }

  const patch = buildEdgePatch(existing, next);
  if (Object.keys(patch).length > 0) {
    const updated = await edgesRepo.update(tx, input.edgeId, patch);
    if (!updated) {
      throw new DomainError("invalid", "Failed to update Edge");
    }
  }

  const listedRow = await edgesRepo.getListedInCase(
    tx,
    input.caseId,
    input.edgeId
  );
  if (!listedRow) {
    throw new DomainError("invalid", "Edge updated but not found");
  }
  return listedRow;
}
