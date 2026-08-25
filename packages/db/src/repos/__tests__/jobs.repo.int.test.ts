import { describe, expect, it } from "vitest";

import {
  seedCase,
  seedJob,
  seedPlaybookRun,
  withTestTx,
} from "@watchdog/test-kit/db";

import { jobsRepo } from "../jobs.repo.ts";

describe("jobsRepo", () => {
  it("releases a blocked playbook step to queued", async () => {
    await withTestTx(async (tx) => {
      const cased = await seedCase(tx);
      const run = await seedPlaybookRun(tx, cased.id);
      await seedJob(tx, cased.id, {
        playbookRunId: run.id,
        playbookStep: 1,
        status: "blocked",
      });
      const released = await jobsRepo.releaseBlockedStep(tx, run.id, 1);
      expect(released).toHaveLength(1);
      const row = released[0];
      expect(row).toBeDefined();
      if (row === undefined) {
        throw new TypeError("expected a released job");
      }
      const queued = await jobsRepo.get(tx, row.id);
      expect(queued?.status).toBe("queued");
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
