import { describe, expect, it, vi } from "vitest";

import { fetchLeakixLookup, leakixLookupSnapshotSchema } from "../leakix";

describe("leakix", () => {
  it("parses empty lookup snapshots", () => {
    const snap = leakixLookupSnapshotSchema.parse({
      query: "8.8.8.8",
      kind: "ip",
      queriedAt: "2026-01-01T00:00:00.000Z",
      source: "leakix.net",
      found: false,
      serviceCount: 0,
      leakCount: 0,
      protocols: [],
      hostnames: [],
    });
    expect(snap.found).toBe(false);
  });

  it("fetchLeakixLookup treats HTTP 404 as no exposure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 404 }))
    );

    const snap = await fetchLeakixLookup(
      "8.8.8.8",
      "test-key",
      AbortSignal.timeout(5000)
    );

    expect(snap.found).toBe(false);
    vi.unstubAllGlobals();
  });
});
