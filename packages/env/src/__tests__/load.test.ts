import { describe, expect, it, vi } from "vitest";

const { config } = vi.hoisted(() => ({
  config: vi.fn(),
}));

vi.mock("dotenv", () => ({
  config,
}));

describe("loadRepoEnv", () => {
  it("loads repo-root .env only once per process", async () => {
    vi.resetModules();
    config.mockClear();
    const { loadRepoEnv } = await import("../load");
    loadRepoEnv();
    loadRepoEnv();
    expect(config).toHaveBeenCalledTimes(1);
    expect(config.mock.calls[0]?.[0]?.quiet).toBe(true);
  });
});
