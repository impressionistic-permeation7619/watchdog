import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

const resetTestDb = vi.fn(async () => {});

vi.mock("@watchdog/test-kit/db", () => ({
  resetTestDb,
}));

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  resetTestDb.mockClear();
  vi.resetModules();
});

describe("e2e global-setup", () => {
  it("seeds e2e env and resets the test database", async () => {
    delete process.env.DATABASE_URL;

    const globalSetup = (await import("./global-setup")).default;
    await globalSetup();

    expect(process.env.DATABASE_URL).toContain("watchdog_e2e");
    expect(resetTestDb).toHaveBeenCalledOnce();
  });
});
