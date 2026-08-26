import {
  edgesRepo,
  entitiesRepo,
  evidenceLinksRepo,
  type DbTx,
} from "@watchdog/db";
import {
  EDGE_PREDICATES,
  edgePredicateAllowsKinds,
  type ConfidenceTier,
  type PatchOp,
} from "@watchdog/schemas";

import { DomainError } from "../../infra/domain-error";
import { requireDomainEnum, requireDomainString } from "./apply-patch-helpers";

export async function applyEdgeOp(
  tx: DbTx,
  caseId: string,
  op: PatchOp,
  confidence: ConfidenceTier | undefined,
  evidenceIds: string[]
): Promise<void> {
  if (op.op !== "create" && op.op !== "upsert") {
    throw new DomainError("invalid", "edge supports create/upsert");
  }
  const fromId = requireDomainString(op.data, "fromId");
  const toId = requireDomainString(op.data, "toId");
  const predicate = requireDomainEnum(
    requireDomainString(op.data, "predicate"),
    EDGE_PREDICATES,
    "edge predicate"
  );
  const notes = typeof op.data.notes === "string" ? op.data.notes : null;
  const fromEntity = await entitiesRepo.getInCase(tx, caseId, fromId);
  const toEntity = await entitiesRepo.getInCase(tx, caseId, toId);
  if (!fromEntity || !toEntity) {
    throw new DomainError("not_found", "Entity not found in this Case");
  }
  if (!edgePredicateAllowsKinds(predicate, fromEntity.kind, toEntity.kind)) {
    throw new DomainError(
      "invalid",
      `${predicate} is not allowed for ${fromEntity.kind} → ${toEntity.kind}`
    );
  }
  if (!confidence) {
    throw new DomainError("invalid", "confidence required for edge");
  }
  if (
    predicate === "related_to" &&
    (notes === null || notes.trim() === "")
  ) {
    throw new DomainError("invalid", "related_to requires notes");
  }

  if (op.op === "upsert") {
    const existing = await edgesRepo.findByNaturalKey(tx, {
      fromId,
      toId,
      predicate,
    });
    if (existing) {
      await edgesRepo.update(tx, existing.id, {
        confidence,
        notes,
      });
      await evidenceLinksRepo.linkEdge(tx, existing.id, evidenceIds);
      return;
    }
  }
  await edgesRepo.create(tx, {
    id: op.id,
    fromId,
    toId,
    predicate,
    confidence,
    notes,
  });
  await evidenceLinksRepo.linkEdge(tx, op.id, evidenceIds);
}
