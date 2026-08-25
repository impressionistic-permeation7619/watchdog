import { setTimeout as delay } from "node:timers/promises";

import { describe, expect, it } from "vitest";

import { testId } from "@watchdog/test-kit";

import { scheduleCaseExport } from "../export-sync.ts";

describe("scheduleCaseExport", () => {
  it("coalesces concurrent schedules into one in-flight write then a follow-up", async () => {
    let inflight = 0;
    let maxInflight = 0;
    let calls = 0;
    const writeExport = async () => {
      inflight += 1;
      maxInflight = Math.max(maxInflight, inflight);
      calls += 1;
      await delay(30);
      inflight -= 1;
    };

    const caseId = testId(1);
    const first = scheduleCaseExport(caseId, writeExport);
    const second = scheduleCaseExport(caseId, writeExport);
    await Promise.all([first, second]);

    expect(maxInflight).toBe(1);
    expect(calls).toBeGreaterThanOrEqual(1);
    expect(calls).toBeLessThanOrEqual(2);
  });
});
