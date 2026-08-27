import { describe, expect, it } from "vitest";

import {
  seedCase,
  seedJob,
  seedPlaybookRun,
  withTestTx,
} from "@watchdog/test-kit/db";

import { jobsRepo } from "../jobs.repo.ts";

describe("jobsRepo", () => {
  it("unblocks historical blocked playbook rows via status update", async () => {
    await withTestTx(async (tx) => {
      const cased = await seedCase(tx);
      const run = await seedPlaybookRun(tx, cased.id);
      const blocked = await seedJob(tx, cased.id, {
        playbookRunId: run.id,
        playbookStep: 1,
        status: "blocked",
      });
      const updated = await jobsRepo.update(tx, blocked.id, {
        status: "queued",
      });
      expect(updated?.status).toBe("queued");
    });
  });

  it("abandons blocked playbook jobs and lists running", async () => {
    await withTestTx(async (tx) => {
      const cased = await seedCase(tx);
      const run = await seedPlaybookRun(tx, cased.id);
      const blocked = await seedJob(tx, cased.id, {
        playbookRunId: run.id,
        playbookStep: 1,
        status: "blocked",
      });
      await seedJob(tx, cased.id, { status: "running" });
      await jobsRepo.abandonBlockedForPlaybook(tx, run.id, "prior failed");
      const after = await jobsRepo.get(tx, blocked.id);
      expect(after?.status).toBe("cancelled");
      const running = await jobsRepo.listRunning(tx);
      expect(running.length).toBeGreaterThan(0);
    });
  });
});
