import { describe, expect, it, vi } from "vitest";

const startConfigRef = vi.hoisted(() => ({
  current: null as {
    requestMiddleware: unknown[];
    functionMiddleware: unknown[];
  } | null,
}));

vi.mock("@tanstack/react-start", () => ({
  createCsrfMiddleware: vi.fn(() => "csrf-middleware"),
  createMiddleware: vi.fn(() => ({
    server: (handler: unknown) => handler,
  })),
  createStart: vi.fn((factory: () => typeof startConfigRef.current) => {
    startConfigRef.current = factory();
    return startConfigRef.current;
  }),
}));

vi.mock("@/auth/middleware", () => ({
  requireAuth: "require-auth",
}));

vi.mock("@/auth/unauthorized-error", () => ({
  isUnauthorizedError: vi.fn(),
}));

vi.mock("./evlog-init.server", () => ({}));

vi.mock("evlog/toolkit", () => ({
  createMiddlewareLogger: vi.fn(() => ({
    logger: {},
    finish: vi.fn(),
    finishResponse: vi.fn(async (_response: Response) => new Response("ok")),
    skipped: true,
  })),
  extractSafeHeaders: vi.fn(() => ({})),
}));

vi.mock("@watchdog/log", () => ({
  createLogger: vi.fn(() => ({
    set: vi.fn(),
    setLevel: vi.fn(),
    emit: vi.fn(),
    error: vi.fn(),
  })),
  runWithRequestLogger: vi.fn(
    async (_logger: unknown, fn: () => Promise<unknown>) => fn()
  ),
}));

import "@/start";

describe("startInstance", () => {
  it("wires evlog, csrf, and auth middleware", () => {
    expect(startConfigRef.current?.requestMiddleware).toHaveLength(2);
    expect(startConfigRef.current?.functionMiddleware).toHaveLength(2);
    expect(startConfigRef.current?.functionMiddleware?.[1]).toBe("require-auth");
    expect(startConfigRef.current?.requestMiddleware?.[0]).toBeDefined();
    expect(startConfigRef.current?.requestMiddleware?.[1]).toBe("csrf-middleware");
    expect(startConfigRef.current?.functionMiddleware?.[0]).toBeDefined();
  });
});
