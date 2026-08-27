import { describe, expect, it, vi } from "vitest";

import { ToolsError } from "../../errors/tools-error";
import { fetchJsonObject } from "../fetch-json";

describe("fetchJsonObject", () => {
  it("returns parsed JSON objects on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify({ ok: true }), { status: 200 })
        )
    );

    const body = await fetchJsonObject({
      url: "https://example.com/api",
      signal: AbortSignal.timeout(5000),
      service: "Example",
      subject: "test",
    });

    expect(body).toEqual({ ok: true });
    vi.unstubAllGlobals();
  });

  it("maps HTTP 429 to rateLimitedToolsError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 429 }))
    );

    await expect(
      fetchJsonObject({
        url: "https://example.com/api",
        signal: AbortSignal.timeout(5000),
        service: "Example",
        subject: "test",
      })
    ).rejects.toThrow(ToolsError);

    vi.unstubAllGlobals();
  });
});
