import { proposalsRepo, type DbExec, type NewProposal } from "@watchdog/db";
import type { PatchOp } from "@watchdog/schemas";

export async function seedProposal(
  exec: DbExec,
  caseId: string,
  patch: PatchOp[],
  overrides: Partial<NewProposal> = {}
): Promise<{ id: string }> {
  const created = await proposalsRepo.create(exec, {
    caseId,
    status: overrides.status ?? "pending",
    patch,
    summary: overrides.summary ?? "test proposal",
    suppressedCount: overrides.suppressedCount,
    evidenceIds: overrides.evidenceIds ?? [],
    jobId: overrides.jobId,
    agentSourced: overrides.agentSourced ?? false,
    userOverridden: overrides.userOverridden ?? false,
    createdBy: overrides.createdBy,
  });
  if (!created) {
    throw new Error("seedProposal failed");
  }
  return created;
}
