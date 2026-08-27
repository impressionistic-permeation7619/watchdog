import { describe, expect, it, vi } from "vitest";

import { fetchHibpBreachedAccount, hibpLookupSnapshotSchema } from "../hibp";

describe("hibp", () => {
  it("parses empty breach snapshots", () => {
    const snap = hibpLookupSnapshotSchema.parse({
      email: "alice@mailhost.test",
      queriedAt: "2026-01-01T00:00:00.000Z",
      found: false,
      breachCount: 0,
      breaches: [],
      status: 404,
    });
    expect(snap.found).toBe(false);
  });

  it("fetchHibpBreachedAccount treats HTTP 404 as no breaches", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 404 }))
    );

    const snap = await fetchHibpBreachedAccount(
      "alice@mailhost.test",
      "test-key",
      AbortSignal.timeout(5000)
    );

    expect(snap.found).toBe(false);
    expect(snap.breachCount).toBe(0);
    vi.unstubAllGlobals();
  });
});
