import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { http, HttpResponse, mockServer } from "@watchdog/test-kit/http";

import { submitWaybackSave } from "../submit.ts";

describe("submitWaybackSave", () => {
  beforeAll(() => {
    mockServer.listen({ onUnhandledRequest: "error" });
  });
  afterEach(() => {
    mockServer.resetHandlers();
  });
  afterAll(() => {
    mockServer.close();
  });

  it("treats HTTP 429 as accepted (status < 500)", async () => {
    mockServer.use(
      http.get(
        /https:\/\/web\.archive\.org\/save\//,
        () => new HttpResponse("slow down", { status: 429 })
      )
    );
    const snap = await submitWaybackSave(
      "https://example.com/",
      new AbortController().signal
    );
    expect(snap.results[0]?.accepted).toBe(true);
    expect(snap.results[0]?.status).toBe(429);
  });

  it("does not accept HTTP 503", async () => {
    mockServer.use(
      http.get(
        /https:\/\/web\.archive\.org\/save\//,
        () => new HttpResponse("unavailable", { status: 503 })
      )
    );
    const snap = await submitWaybackSave(
      "https://example.com/",
      new AbortController().signal
    );
    expect(snap.results[0]?.accepted).toBe(false);
    expect(snap.results[0]?.status).toBe(503);
  });
});
