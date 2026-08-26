import { questionsRepo, type DbTx } from "@watchdog/db";
import type { PatchOp } from "@watchdog/schemas";

import { DomainError } from "../../infra/domain-error";
import { assertEntityInCase } from "./guards";
import { requireString } from "./apply-patch-helpers";

export async function applyQuestionOp(
  tx: DbTx,
  caseId: string,
  op: PatchOp
): Promise<void> {
  if (op.op !== "create") {
    throw new DomainError("invalid", "question only supports create");
  }
  const entityId = requireString(op.data, "entityId");
  await assertEntityInCase(caseId, entityId, tx);
  const text = requireString(op.data, "text");
  await questionsRepo.create(tx, {
    id: op.id,
    entityId,
    text,
    status: "open",
  });
}
