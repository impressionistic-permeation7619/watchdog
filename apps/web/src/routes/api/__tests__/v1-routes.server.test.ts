import { describe, expect, it, vi } from "vitest";

const handleOpenApiRequestMock = vi.hoisted(() =>
  vi.fn().mockImplementation(() => Promise.resolve(new Response("openapi-ok")))
);

vi.mock("@tanstack/react-router", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-router")>();
  return {
    ...actual,
    createFileRoute: () => (options: Record<string, unknown>) => ({ options }),
  };
});

vi.mock("@/lib/openapi-handler.server", () => ({
  handleOpenApiRequest: handleOpenApiRequestMock,
}));

import { Route as V1RootRoute } from "@/routes/api/v1";
import { Route as V1WildcardRoute } from "@/routes/api/v1.$";

describe("api v1 routes", () => {
  it("delegates exact root requests to handleOpenApiRequest", async () => {
    handleOpenApiRequestMock.mockClear();
    const request = new Request("http://localhost/api/v1");
    const handlers = (
      V1RootRoute.options as {
        server: { handlers: Record<string, (ctx: { request: Request }) => Promise<Response>> };
      }
    ).server.handlers;

    const response = await handlers.ANY({ request });

    expect(handleOpenApiRequestMock).toHaveBeenCalledWith(request);
    expect(await response.text()).toBe("openapi-ok");
  });

  it("delegates wildcard requests to handleOpenApiRequest", async () => {
    handleOpenApiRequestMock.mockClear();
    const request = new Request("http://localhost/api/v1/health");
    const handlers = (
      V1WildcardRoute.options as {
        server: { handlers: Record<string, (ctx: { request: Request }) => Promise<Response>> };
      }
    ).server.handlers;

    const response = await handlers.ANY({ request });

    expect(handleOpenApiRequestMock).toHaveBeenCalledWith(request);
    expect(await response.text()).toBe("openapi-ok");
  });
});
