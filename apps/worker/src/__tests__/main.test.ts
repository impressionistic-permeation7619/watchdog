import { describe, expect, it, vi } from "vitest";

const workerMocks = vi.hoisted(() => {
  const work = vi.fn();
  const stop = vi.fn(async () => undefined);
  const ensureBossWorker = vi.fn(async () => ({ work, stop }));

  return {
    work,
    stop,
    ensureBossWorker,
    reconcileStaleJobs: vi.fn(async () => 0),
    reconcileStuckPlaybookRuns: vi.fn(async () => 0),
    listenForEvents: vi.fn(() => ({ end: vi.fn(async () => undefined) })),
    listActiveJobIds: vi.fn(() => [] as string[]),
  };
});

vi.mock("@watchdog/core/worker", () => ({
  CAP_JOB_QUEUE: "cap-jobs",
  abortActiveJob: vi.fn(),
  executeJob: vi.fn(),
  findCancelledJobIds: vi.fn(),
  ensureBossWorker: workerMocks.ensureBossWorker,
  gracefulStopTimeoutMs: vi.fn(() => 1000),
  isCapJobPayload: vi.fn(() => false),
  isWatchdogEvent: vi.fn(() => false),
  listenForEvents: workerMocks.listenForEvents,
  listActiveJobIds: workerMocks.listActiveJobIds,
  reconcileStaleJobs: workerMocks.reconcileStaleJobs,
  reconcileStuckPlaybookRuns: workerMocks.reconcileStuckPlaybookRuns,
}));

vi.mock("@watchdog/env/server", () => ({}));

vi.mock("@watchdog/log", () => ({
  createLogger: vi.fn(() => ({
    set: vi.fn(),
    error: vi.fn(),
    emit: vi.fn(),
  })),
  initWatchdogLogger: vi.fn(),
  jobWideEventFields: vi.fn((fields: unknown) => fields),
}));

vi.mock("../export-events", () => ({
  handleExportEvent: vi.fn(),
}));

import { bootWorker } from "../main";

describe("bootWorker", () => {
  it("starts pg-boss worker and event listener", async () => {
    await bootWorker();

    expect(workerMocks.ensureBossWorker).toHaveBeenCalledTimes(1);
    expect(workerMocks.reconcileStaleJobs).toHaveBeenCalledTimes(1);
    expect(workerMocks.reconcileStuckPlaybookRuns).toHaveBeenCalledTimes(1);
    expect(workerMocks.work).toHaveBeenCalledTimes(1);
    expect(workerMocks.listenForEvents).toHaveBeenCalledTimes(1);
  });
});
