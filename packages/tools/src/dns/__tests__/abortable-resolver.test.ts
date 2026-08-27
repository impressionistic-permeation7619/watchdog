import { describe, expect, it } from "vitest";

import { ToolsError } from "../../errors/tools-error";
import { assertNotAborted, withAbortableResolver } from "../abortable-resolver";

describe("abortable-resolver", () => {
  it("assertNotAborted throws when signal is already aborted", () => {
    const controller = new AbortController();
    controller.abort();

    expect(() => assertNotAborted(controller.signal, "aborted")).toThrow(ToolsError);
  });

  it("withAbortableResolver throws when signal is already aborted", () => {
    const controller = new AbortController();
    controller.abort();

    expect(() =>
      withAbortableResolver(controller.signal, "aborted")
    ).toThrow(ToolsError);
  });

  it("withAbortableResolver returns resolver and cleanup", () => {
    const controller = new AbortController();
    const { resolver, cleanup } = withAbortableResolver(
      controller.signal,
      "aborted"
    );

    expect(resolver).toBeDefined();
    cleanup();
    controller.abort();
  });
});
