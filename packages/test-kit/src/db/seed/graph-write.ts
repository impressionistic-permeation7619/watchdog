import { graphWritesRepo, type DbExec, type NewGraphWrite } from "@watchdog/db";
import type { PatchOp } from "@watchdog/schemas";

import { TEST_ACTOR_ID } from "../../fixtures/ids.ts";

export async function seedGraphWrite(
  exec: DbExec,
  caseId: string,
  patch: PatchOp[],
  overrides: Partial<NewGraphWrite> = {}
): Promise<{ id: string }> {
  const created = await graphWritesRepo.create(exec, {
    caseId,
    actorId: overrides.actorId ?? TEST_ACTOR_ID,
    channel: overrides.channel ?? "agent_write",
    userOverridden: overrides.userOverridden ?? true,
    confidence: overrides.confidence ?? "unverified",
    summary: overrides.summary ?? null,
    patch,
    idempotencyKey: overrides.idempotencyKey ?? null,
  });
  if (!created) {
    throw new Error("seedGraphWrite failed");
  }
  return created;
}
