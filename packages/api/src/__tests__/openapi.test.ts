import { describe, expect, it } from "vitest";

import { generateOpenAPISpec } from "../openapi";

describe("generateOpenAPISpec", () => {
  it("builds Watchdog API metadata with auth schemes", async () => {
    const spec = await generateOpenAPISpec("http://127.0.0.1:3000/api/v1");

    expect(spec.info?.title).toBe("Watchdog API");
    expect(spec.servers?.[0]?.url).toBe("http://127.0.0.1:3000/api/v1");
    expect(spec.components?.securitySchemes).toMatchObject({
      bearerAuth: { type: "http", scheme: "bearer" },
      apiKeyAuth: { type: "apiKey", in: "header", name: "x-api-key" },
    });
  });
});
