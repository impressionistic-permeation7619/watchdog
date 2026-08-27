import { describe, expect, it, vi } from "vitest";

import { testHttpOrigin } from "@watchdog/test-kit";

vi.mock("@better-auth/api-key", () => ({ apiKey: vi.fn(() => ({})) }));
vi.mock("@better-auth/drizzle-adapter", () => ({
  drizzleAdapter: vi.fn(() => ({})),
}));
vi.mock("better-auth", () => ({
  betterAuth: vi.fn((config: unknown) => ({ config, api: {}, $Infer: {} })),
}));
vi.mock("better-auth/tanstack-start", () => ({
  tanstackStartCookies: vi.fn(() => ({})),
}));
vi.mock("@watchdog/db", () => ({
  db: {},
  account: {},
  session: {},
  user: {},
  verification: {},
  apiKey: {},
}));
vi.mock("@watchdog/env/server", () => ({
  env: {
    BETTER_AUTH_URL: testHttpOrigin("127.0.0.1:3000", ""),
    BETTER_AUTH_ALLOW_SIGNUP: false,
    BETTER_AUTH_SECRET: "test-secret-must-be-at-least-32-chars",
    BETTER_AUTH_TRUSTED_ORIGINS: [],
  },
}));

import { betterAuth } from "better-auth";

import { auth } from "@/auth/server";

describe("auth server", () => {
  it("configures Better Auth with api key and cookie plugins", () => {
    expect(auth.api).toBeDefined();
    expect(betterAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        appName: "Watchdog",
        baseURL: testHttpOrigin("127.0.0.1:3000", ""),
      })
    );
  });
});
