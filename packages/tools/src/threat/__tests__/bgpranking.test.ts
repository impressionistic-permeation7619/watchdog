import { describe, expect, it, vi } from "vitest";

import {
  bgprankingLookupSnapshotSchema,
  fetchBgprankingLookup,
} from "../bgpranking";

describe("bgpranking", () => {
  it("fetchBgprankingLookup maps ASN ranking data", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              response: { "2026-01-01": { asn: 15169 } },
            }),
            { status: 200 }
          )
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              response: {
                asn_description: "GOOGLE",
                ranking: { rank: 1.23, position: 5 },
              },
            }),
            { status: 200 }
          )
        )
    );

    const snap = await fetchBgprankingLookup(
      "8.8.8.8",
      AbortSignal.timeout(5000)
    );

    expect(bgprankingLookupSnapshotSchema.parse(snap).found).toBe(true);
    expect(snap.asn).toBe(15169);
    vi.unstubAllGlobals();
  });
});
