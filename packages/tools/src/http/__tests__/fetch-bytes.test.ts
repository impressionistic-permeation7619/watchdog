import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import {
  http,
  HttpResponse,
  mockJson,
  mockServer,
} from "@watchdog/test-kit/http";

import { fetchBytes } from "../fetch-bytes.ts";

describe("fetchBytes", () => {
  beforeAll(() => {
    mockServer.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    mockServer.resetHandlers();
  });

  afterAll(() => {
    mockServer.close();
  });

  it("returns truncated bytes and status from the mocked response", async () => {
    mockJson("https://example.test/page", { hello: "world" });
    const result = await fetchBytes(
      "https://example.test/page",
      new AbortController().signal,
      { userAgent: "watchdog-test", maxBytes: 16, accept: "application/json" }
    );
    expect(result.ok).toBe(true);
    expect(result.status).toBe(200);
    expect(result.bytes.byteLength).toBeLessThanOrEqual(16);
    expect(new TextDecoder().decode(result.bytes)).toContain("{");
  });

  it("returns HTTP error details when the mocked status is not ok", async () => {
    mockJson(
      "https://example.test/missing",
      { error: "nope" },
      { status: 404 }
    );
    const result = await fetchBytes(
      "https://example.test/missing",
      new AbortController().signal,
      { userAgent: "watchdog-test", maxBytes: 1024 }
    );
    expect(result.ok).toBe(false);
    expect(result.status).toBe(404);
    expect(result.error).toMatch(/HTTP 404/);
  });

  it("cuts the body at maxBytes", async () => {
    mockServer.use(
      http.get("https://example.test/long", () =>
        HttpResponse.text("abcdefghij")
      )
    );
    const result = await fetchBytes(
      "https://example.test/long",
      new AbortController().signal,
      { userAgent: "watchdog-test", maxBytes: 4 }
    );
    expect(result.bytes.byteLength).toBe(4);
    expect(new TextDecoder().decode(result.bytes)).toBe("abcd");
  });

  it("returns an error when the signal is aborted", async () => {
    const controller = new AbortController();
    controller.abort();
    const result = await fetchBytes(
      "https://example.test/page",
      controller.signal,
      { userAgent: "watchdog-test", maxBytes: 1024 }
    );
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/abort/i);
  });
});
