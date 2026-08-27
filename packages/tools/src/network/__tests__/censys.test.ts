import { describe, expect, it, vi } from "vitest";

import { censysLookupSnapshotSchema, fetchCensysHost } from "../censys";

describe("censys", () => {
  it("parses empty host snapshots", () => {
    const snap = censysLookupSnapshotSchema.parse({
      ip: "8.8.8.8",
      queriedAt: "2026-01-01T00:00:00.000Z",
      found: false,
      status: 404,
      asn: null,
      asName: null,
      asCountryCode: null,
      countryCode: null,
      city: null,
      ports: [],
      serviceNames: [],
      hostnames: [],
    });
    expect(snap.found).toBe(false);
  });

  it("fetchCensysHost maps HTTP 404 to found=false", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 404 }))
    );

    const snap = await fetchCensysHost(
      "8.8.8.8",
      "id",
      "secret",
      AbortSignal.timeout(5000)
    );

    expect(snap.found).toBe(false);
    vi.unstubAllGlobals();
  });
});
