import { eventsRepo, type DbTx } from "@watchdog/db";
import type { PatchOp } from "@watchdog/schemas";

import { DomainError } from "../../infra/domain-error";
import { assertEntityInCase } from "./guards";
import { requireDomainString } from "./apply-patch-helpers";

export async function applyEventOp(
  tx: DbTx,
  caseId: string,
  op: PatchOp
): Promise<void> {
  if (op.op !== "create") {
    throw new DomainError("invalid", "event only supports create");
  }
  const entityId = requireDomainString(op.data, "entityId");
  await assertEntityInCase(caseId, entityId, tx);
  const when = requireDomainString(op.data, "when");
  const what = requireDomainString(op.data, "what");
  const whereText =
    typeof op.data.where === "string" ? op.data.where : null;
  await eventsRepo.create(tx, {
    id: op.id,
    entityId,
    when,
    what,
    whereText,
  });
}
