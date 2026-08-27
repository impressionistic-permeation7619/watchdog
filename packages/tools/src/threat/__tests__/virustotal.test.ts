import { describe, expect, it, vi } from "vitest";

import {
  fetchVirusTotalLookup,
  virusTotalLookupSnapshotSchema,
} from "../virustotal";

describe("virustotal", () => {
  it("fetchVirusTotalLookup maps HTTP 404 to found=false", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 404 }))
    );

    const snap = await fetchVirusTotalLookup(
      "8.8.8.8",
      "test-key",
      AbortSignal.timeout(5000)
    );

    expect(virusTotalLookupSnapshotSchema.parse(snap).found).toBe(false);
    vi.unstubAllGlobals();
  });
});
