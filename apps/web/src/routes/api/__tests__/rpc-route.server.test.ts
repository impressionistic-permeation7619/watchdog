import { describe, expect, it, vi } from "vitest";

const handleMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ response: new Response("rpc-ok") })
);
const createApiContextMock = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ actorId: "actor-1" })
);

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    createFileRoute: () => (options: Record<string, unknown>) => ({ options }),
  };
});

vi.mock("@orpc/server/fetch", () => ({
  RPCHandler: vi.fn().mockImplementation(function RPCHandler() {
    return { handle: handleMock };
  }),
}));

vi.mock("@/auth/api-context.server", () => ({
  createApiContext: createApiContextMock,
}));

vi.mock("@/lib/api-cors.server", () => ({
  watchdogCorsPlugin: {},
}));

vi.mock("@watchdog/api", () => ({
  router: {},
}));

import { Route } from "@/routes/api/rpc.$";

describe("api rpc route", () => {
  it("delegates requests to the oRPC handler with api context", async () => {
    const request = new Request("http://localhost/api/rpc/cases.list");
    const handlers = (
      Route.options as { server: { handlers: Record<string, (ctx: { request: Request }) => Promise<Response>> } }
    ).server.handlers;

    const response = await handlers.ANY({ request });

    expect(createApiContextMock).toHaveBeenCalledWith(request);
    expect(handleMock).toHaveBeenCalledWith(
      request,
      expect.objectContaining({
        prefix: "/api/rpc",
        context: { actorId: "actor-1" },
      })
    );
    expect(await response.text()).toBe("rpc-ok");
    expect(response.status).toBe(200);
  });

  it("returns 404 when the oRPC handler has no matching route", async () => {
    handleMock.mockResolvedValue({ response: undefined });
    const handlers = (
      Route.options as { server: { handlers: Record<string, (ctx: { request: Request }) => Promise<Response>> } }
    ).server.handlers;

    const response = await handlers.ANY({
      request: new Request("http://localhost/api/rpc/missing"),
    });

    expect(response.status).toBe(404);
  });
});
