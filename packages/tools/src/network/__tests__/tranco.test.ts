import { describe, expect, it, vi } from "vitest";

import { fetchTrancoLookup, trancoLookupSnapshotSchema } from "../tranco";

describe("tranco", () => {
  it("fetchTrancoLookup maps rank history", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ranks: [{ date: "2026-01-01", rank: 42 }],
          }),
          { status: 200 }
        )
      )
    );

    const snap = await fetchTrancoLookup(
      "example.com",
      AbortSignal.timeout(5000)
    );

    expect(trancoLookupSnapshotSchema.parse(snap).found).toBe(true);
    expect(snap.latestRank).toBe(42);
    vi.unstubAllGlobals();
  });
});
