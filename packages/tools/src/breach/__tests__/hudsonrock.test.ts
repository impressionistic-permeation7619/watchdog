import { describe, expect, it, vi } from "vitest";

import {
  fetchHudsonrockLookup,
  hudsonrockLookupSnapshotSchema,
} from "../hudsonrock";

describe("hudsonrock", () => {
  it("parses empty lookup snapshots", () => {
    const snap = hudsonrockLookupSnapshotSchema.parse({
      query: "alice@mailhost.test",
      kind: "email",
      queriedAt: "2026-01-01T00:00:00.000Z",
      source: "api.hudsonrock.com",
      found: false,
      totalResults: 0,
      newestDate: null,
    });
    expect(snap.found).toBe(false);
  });

  it("fetchHudsonrockLookup treats HTTP 404 as no hits", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 404 }))
    );

    const snap = await fetchHudsonrockLookup(
      "alice@mailhost.test",
      "test-key",
      AbortSignal.timeout(5000)
    );

    expect(snap.found).toBe(false);
    expect(snap.totalResults).toBe(0);
    vi.unstubAllGlobals();
  });
});
