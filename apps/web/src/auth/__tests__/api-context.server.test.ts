import { describe, expect, it, vi } from "vitest";

vi.mock("@/auth/server", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
      verifyApiKey: vi.fn(),
    },
  },
}));

vi.mock("@watchdog/log", () => ({
  identifyUser: vi.fn(),
  peekRequestLogger: vi.fn(() => null),
}));

import { auth } from "@/auth/server";
import { actorFromSession, createApiContext } from "@/auth/api-context.server";

describe("api-context.server", () => {
  it("maps a session user to an ApiActor", () => {
    expect(
      actorFromSession({
        user: { id: "user-1", email: "a@example.com", name: "Analyst" },
      })
    ).toEqual({
      userId: "user-1",
      email: "a@example.com",
      name: "Analyst",
    });
  });

  it("returns a session-backed API context", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "user-1", email: null, name: "Analyst" },
    } as never);

    const context = await createApiContext(
      new Request("http://127.0.0.1/api/v1/health")
    );

    expect(context.authMethod).toBe("session");
    expect(context.actor).toEqual({
      userId: "user-1",
      email: null,
      name: "Analyst",
    });
  });
});
