import { describe, expect, it, vi } from "vitest";

vi.mock("@t3-oss/env-core", () => ({
  createEnv: vi.fn(() => ({ DATABASE_URL: "postgres://test" })),
}));

describe("server env entrypoint", () => {
  it("exports validated env from createEnv", async () => {
    const { env } = await import("../server");
    expect(env.DATABASE_URL).toBe("postgres://test");
  });
});
