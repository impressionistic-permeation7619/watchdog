import { describe, expect, it, vi } from "vitest";

import { fetchShodanHost, shodanLookupSnapshotSchema } from "../shodan";

describe("shodan", () => {
  it("fetchShodanHost maps HTTP 404 to found=false", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 404 }))
    );

    const snap = await fetchShodanHost(
      "8.8.8.8",
      "test-key",
      AbortSignal.timeout(5000)
    );

    expect(shodanLookupSnapshotSchema.parse(snap).found).toBe(false);
    vi.unstubAllGlobals();
  });
});
