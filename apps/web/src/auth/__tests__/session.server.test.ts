import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start/server", () => ({
  getRequestHeaders: vi.fn(() => ({ cookie: "session=1" })),
}));

vi.mock("@/auth/server", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

import { getRequestHeaders } from "@tanstack/react-start/server";

import { auth } from "@/auth/server";
import { readSession, requireSession } from "@/auth/session.server";
import { UnauthorizedError } from "@/auth/unauthorized-error";

describe("session.server", () => {
  it("reads the session from request headers", async () => {
    const session = {
      session: { id: "sess-1" },
      user: { id: "user-1" },
    };
    vi.mocked(auth.api.getSession).mockResolvedValue(
      session as Awaited<ReturnType<typeof auth.api.getSession>>
    );

    await expect(readSession()).resolves.toBe(session);
    expect(getRequestHeaders).toHaveBeenCalled();
    expect(auth.api.getSession).toHaveBeenCalledWith({
      headers: { cookie: "session=1" },
    });
  });

  it("throws UnauthorizedError when no session exists", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    await expect(requireSession()).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
