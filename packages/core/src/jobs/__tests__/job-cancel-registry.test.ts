import { describe, expect, it } from "vitest";

import {
  abortActiveJob,
  getActiveJobAbortSignal,
  listActiveJobIds,
  registerActiveJobController,
  unregisterActiveJobController,
} from "../job-cancel-registry";

describe("job-cancel-registry", () => {
  it("registers controllers and aborts active jobs", () => {
    const controller = new AbortController();
    registerActiveJobController("job-1", controller);

    expect(listActiveJobIds()).toContain("job-1");
    expect(getActiveJobAbortSignal("job-1")).toBe(controller.signal);
    expect(abortActiveJob("job-1", "cancel")).toBe(true);
    expect(controller.signal.aborted).toBe(true);

    unregisterActiveJobController("job-1");
    expect(abortActiveJob("job-1", "timeout")).toBe(false);
  });
});
