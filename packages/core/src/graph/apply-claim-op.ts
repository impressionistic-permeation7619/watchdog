import { claimsRepo, evidenceLinksRepo, type DbTx } from "@watchdog/db";
import {
  CLAIM_CLASSES,
  type ClaimClass,
  type ConfidenceTier,
  type PatchOp,
} from "@watchdog/schemas";

import { DomainError } from "../infra/domain-error";
import { assertEntityInCase } from "./guards";
import { requireEnum, requireString } from "./apply-patch-helpers";

export async function applyClaimOp(
  tx: DbTx,
  caseId: string,
  op: PatchOp,
  confidence: ConfidenceTier | undefined,
  evidenceIds: string[]
): Promise<void> {
  if (op.op !== "create") {
    throw new DomainError("invalid", "claim only supports create");
  }
  const entityId = requireString(op.data, "entityId");
  await assertEntityInCase(caseId, entityId, tx);
  const text = requireString(op.data, "text");
  const claimClass =
    typeof op.data.class === "string"
      ? requireEnum(op.data.class, CLAIM_CLASSES, "claim class")
      : ("observation" satisfies ClaimClass);
  if (!confidence) {
    throw new DomainError("invalid", "confidence required for claim");
  }
  await claimsRepo.create(tx, {
    id: op.id,
    entityId,
    text,
    class: claimClass,
    confidence,
  });
  await evidenceLinksRepo.linkClaim(tx, op.id, evidenceIds);
}
