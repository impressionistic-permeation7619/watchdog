import { describe, expect, it } from "vitest";

import type { WatchdogEvent } from "@watchdog/core";

import { shouldTriggerCaseExport } from "../export-events";

describe("shouldTriggerCaseExport", () => {
  const caseId = "11111111-1111-4111-8111-000000000001";

  it("returns true for a succeeded job_update", () => {
    const event: WatchdogEvent = {
      type: "job_update",
      caseId,
      jobId: "22222222-2222-4222-8222-000000000002",
      status: "succeeded",
    };
    expect(shouldTriggerCaseExport(event)).toBe(true);
  });

  it("returns false for a failed job_update", () => {
    const event: WatchdogEvent = {
      type: "job_update",
      caseId,
      jobId: "22222222-2222-4222-8222-000000000002",
      status: "failed",
    };
    expect(shouldTriggerCaseExport(event)).toBe(false);
  });

  it("returns true for entity_changed", () => {
    const event: WatchdogEvent = { type: "entity_changed", caseId };
    expect(shouldTriggerCaseExport(event)).toBe(true);
  });

  it("returns false for task_changed", () => {
    const event: WatchdogEvent = { type: "task_changed", caseId };
    expect(shouldTriggerCaseExport(event)).toBe(false);
  });
});
