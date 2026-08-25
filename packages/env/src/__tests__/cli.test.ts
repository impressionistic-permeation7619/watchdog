import { describe, expect, it, vi } from "vitest";

vi.mock("@t3-oss/env-core", () => ({
  createEnv: vi.fn(() => {
    throw new Error("createEnv must not run at import");
  }),
}));

describe("@watchdog/env/cli import", () => {
  it("does not call createEnv at import time", async () => {
    const mod = await import("../cli");
    expect(typeof mod.loadCliEnv).toBe("function");
  });
});
