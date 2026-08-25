import { jobsRepo, type DbExec, type JobRow, type NewJob } from "@watchdog/db";

import { TEST_ACTOR_ID } from "../../fixtures/ids.ts";

export async function seedJob(
  exec: DbExec,
  caseId: string,
  overrides: Partial<NewJob> = {}
): Promise<JobRow> {
  const created = await jobsRepo.create(exec, {
    caseId,
    capabilityId: overrides.capabilityId ?? "network.dns.lookup",
    input: overrides.input ?? { host: "example.com" },
    status: overrides.status ?? "queued",
    actorId: overrides.actorId ?? TEST_ACTOR_ID,
    logs: overrides.logs,
    playbookRunId: overrides.playbookRunId,
    playbookStep: overrides.playbookStep,
    playbookFanIndex: overrides.playbookFanIndex,
    output: overrides.output,
    evidenceIds: overrides.evidenceIds,
    handoff: overrides.handoff,
  });
  if (!created) {
    throw new Error("seedJob failed");
  }
  return created;
}
