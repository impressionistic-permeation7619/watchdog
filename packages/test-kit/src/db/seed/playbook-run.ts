import {
  playbookRunsRepo,
  type DbExec,
  type NewPlaybookRun,
  type PlaybookRunRow,
} from "@watchdog/db";

import { TEST_ACTOR_ID } from "../../fixtures/ids.ts";

export async function seedPlaybookRun(
  exec: DbExec,
  caseId: string,
  overrides: Partial<NewPlaybookRun> = {}
): Promise<PlaybookRunRow> {
  const created = await playbookRunsRepo.create(exec, {
    caseId,
    playbookId: overrides.playbookId ?? "url-capture",
    seed: overrides.seed ?? { url: "https://mailhost.test/" },
    status: overrides.status ?? "running",
    actorId: overrides.actorId ?? TEST_ACTOR_ID,
  });
  if (!created) {
    throw new Error("seedPlaybookRun failed");
  }
  return created;
}
