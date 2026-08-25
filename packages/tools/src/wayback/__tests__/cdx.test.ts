import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { http, HttpResponse, mockServer } from "@watchdog/test-kit/http";

import { fetchWaybackLookup } from "../cdx.ts";

describe("fetchWaybackLookup", () => {
  beforeAll(() => {
    mockServer.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    mockServer.resetHandlers();
  });

  afterAll(() => {
    mockServer.close();
  });

  it("returns empty rows on HTTP 200 with no snapshots", async () => {
    mockServer.use(
      http.get(/https:\/\/web\.archive\.org\/cdx\/search\/cdx/, () =>
        HttpResponse.json([])
      )
    );
    const snap = await fetchWaybackLookup(
      "https://example.com/",
      new AbortController().signal,
      {
        userAgent: "watchdog-test",
      }
    );
    expect(snap.rows).toEqual([]);
    expect(snap.closestTimestamp).toBeNull();
  });

  it("throws on a non-OK CDX response", async () => {
    mockServer.use(
      http.get(
        /https:\/\/web\.archive\.org\/cdx\/search\/cdx/,
        () => new HttpResponse("unavailable", { status: 503 })
      )
    );
    await expect(
      fetchWaybackLookup("https://example.com/", new AbortController().signal, {
        userAgent: "watchdog-test",
      })
    ).rejects.toThrow(/Wayback CDX HTTP 503/);
  });
});
