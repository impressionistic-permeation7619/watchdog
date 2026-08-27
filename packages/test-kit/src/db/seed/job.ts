import { jobsRepo, type DbExec, type JobRow, type NewJob } from "@watchdog/db";

import { TEST_ACTOR_ID } from "../../fixtures/ids.ts";

export async function seedJob(
  exec: DbExec,
  caseId: string,
  overrides?: Partial<NewJob>
): Promise<JobRow> {
  const overridesResolved = overrides ?? {};
  const created = await jobsRepo.create(exec, {
    caseId,
    capabilityId: overridesResolved.capabilityId ?? "network.dns.lookup",
    input: overridesResolved.input ?? { host: "example.com" },
    status: overridesResolved.status ?? "queued",
    actorId: overridesResolved.actorId ?? TEST_ACTOR_ID,
    logs: overridesResolved.logs,
    playbookRunId: overridesResolved.playbookRunId,
    playbookStep: overridesResolved.playbookStep,
    playbookFanIndex: overridesResolved.playbookFanIndex,
    output: overridesResolved.output,
    evidenceIds: overridesResolved.evidenceIds,
    handoff: overridesResolved.handoff,
  });
  if (!created) {
    throw new Error("seedJob failed");
  }
  return created;
}
