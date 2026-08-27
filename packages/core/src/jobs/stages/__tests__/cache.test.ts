import { describe, expect, it, vi } from "vitest";

const { storeCapCache } = vi.hoisted(() => ({
  storeCapCache: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../cap-cache", () => ({
  storeCapCache,
}));

import { storeCacheStage } from "../cache";
import type { CollectRuntime } from "../collect";
import type { PreflightState } from "../preflight";

function makeRuntime(overrides: Partial<CollectRuntime> = {}): CollectRuntime {
  return {
    scratchDir: "/tmp",
    controller: new AbortController(),
    timer: setTimeout(() => {}, 60_000),
    jobLog: { lines: [], log: vi.fn() },
    evidenceSnapshot: undefined,
    linkedSource: undefined,
    cacheTtlMs: 60_000,
    inputHash: "abc123",
    ...overrides,
  };
}

function makeState(): PreflightState {
  return {
    jobId: "job-1",
    job: { caseId: "case-1" } as PreflightState["job"],
    cap: { id: "network.dns.lookup" } as PreflightState["cap"],
  } as PreflightState;
}

describe("storeCacheStage", () => {
  it("skips when cache is disabled or result came from cache", async () => {
    await storeCacheStage({
      state: makeState(),
      runtime: makeRuntime({ cacheTtlMs: null }),
      artifacts: [],
      resultSummary: "ok",
      fromCache: false,
      reclaim: false,
      interpretError: null,
    });
    expect(storeCapCache).not.toHaveBeenCalled();

    storeCapCache.mockClear();
    await storeCacheStage({
      state: makeState(),
      runtime: makeRuntime(),
      artifacts: [],
      resultSummary: "ok",
      fromCache: true,
      reclaim: false,
      interpretError: null,
    });
    expect(storeCapCache).not.toHaveBeenCalled();
  });

  it("persists cache entry for fresh successful collect runs", async () => {
    storeCapCache.mockClear();
    const runtime = makeRuntime();
    await storeCacheStage({
      state: makeState(),
      runtime,
      artifacts: [
        {
          name: "report.json",
          mime: "application/json",
          uri: "u",
          sha256: "s",
        },
      ],
      resultSummary: "done",
      fromCache: false,
      reclaim: false,
      interpretError: null,
    });
    expect(storeCapCache).toHaveBeenCalledWith(
      expect.objectContaining({
        caseId: "case-1",
        capabilityId: "network.dns.lookup",
        inputHash: "abc123",
        ttlMs: 60_000,
      })
    );
  });
});
