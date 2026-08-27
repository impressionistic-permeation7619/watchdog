import { describe, expect, it, vi } from "vitest";

const { update, notifyEvent } = vi.hoisted(() => ({
  update: vi.fn(),
  notifyEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@watchdog/db", () => ({
  db: {},
  jobsRepo: {
    update,
  },
}));

vi.mock("../../infra/events", () => ({
  notifyEvent: (...args: unknown[]) => notifyEvent(...args),
}));

import { setJobStatus } from "../set-job-status";

describe("setJobStatus", () => {
  it("returns null when update matches no row", async () => {
    update.mockResolvedValueOnce(null);
    const result = await setJobStatus("job-1", { status: "running" });
    expect(result).toBeNull();
    expect(notifyEvent).not.toHaveBeenCalled();
  });

  it("returns updated row and optionally notifies", async () => {
    update.mockResolvedValueOnce({
      id: "job-1",
      caseId: "case-1",
      status: "completed",
    });
    const result = await setJobStatus(
      "job-1",
      { status: "completed" },
      { notify: true, caseId: "case-1" }
    );
    expect(result?.status).toBe("completed");
    await vi.waitFor(() => {
      expect(notifyEvent).toHaveBeenCalledWith({
        type: "job_update",
        caseId: "case-1",
        jobId: "job-1",
        status: "completed",
      });
    });
  });
});
