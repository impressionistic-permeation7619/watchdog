import { describe, expect, it, vi } from "vitest";

import {
  fetchSafebrowsingLookup,
  safebrowsingLookupSnapshotSchema,
} from "../safebrowsing";

describe("safebrowsing", () => {
  it("fetchSafebrowsingLookup maps empty threat matches", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({}), { status: 200 }))
    );

    const snap = await fetchSafebrowsingLookup(
      "https://example.com",
      "test-key",
      AbortSignal.timeout(5000)
    );

    expect(safebrowsingLookupSnapshotSchema.parse(snap).found).toBe(false);
    vi.unstubAllGlobals();
  });
});
