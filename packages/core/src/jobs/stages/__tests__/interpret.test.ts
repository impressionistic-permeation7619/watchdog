import { describe, expect, it, vi } from "vitest";

const { loadCapReport } = vi.hoisted(() => ({
  loadCapReport: vi.fn(),
}));

vi.mock("../../load-cap-report", () => ({
  loadCapReport,
}));

vi.mock("../../infra/blob", () => ({
  readArtifactBytes: vi.fn(),
}));

import type { CollectRuntime } from "../collect";
import { createJobLog } from "../helpers";
import type { PreflightState } from "../preflight";
import { interpretStage, logInterpretFailure } from "../interpret";

describe("interpret stage", () => {
  it("logInterpretFailure appends log line and fallback summary", () => {
    const jobLog = createJobLog();
    const summary = logInterpretFailure(jobLog, "bad patch", null);
    expect(summary).toContain("interpretation failed");
    expect(jobLog.lines.some((line) => line.includes("interpret failed"))).toBe(
      true
    );
  });

  it("returns early when interpret and handoff are not needed", async () => {
    const runtime = {
      evidenceSnapshot: undefined,
    } as CollectRuntime;
    const state = {
      cap: {},
      input: {},
    } as PreflightState;

    const result = await interpretStage(state, [], runtime, {
      proposalId: null,
      resultSummary: "cached",
    });

    expect(result.resultSummary).toBe("cached");
    expect(result.patch).toEqual([]);
    expect(result.interpretError).toBeNull();
  });

  it("captures interpret errors when report.json is missing", async () => {
    loadCapReport.mockResolvedValueOnce(null);
    const runtime = { evidenceSnapshot: undefined } as CollectRuntime;
    const state = {
      cap: { interpret: vi.fn() },
      input: {},
    } as PreflightState;

    const result = await interpretStage(state, [], runtime, {
      proposalId: null,
      resultSummary: null,
    });

    expect(result.interpretError).toContain("No report.json");
  });
});
