import { describe, expect, it, vi } from "vitest";

import { fetchOtxLookup, otxLookupSnapshotSchema } from "../otx";

describe("otx", () => {
  it("fetchOtxLookup maps pulse summaries", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            pulse_info: {
              count: 1,
              pulses: [{ name: "Example Pulse", malware_families: ["Emotet"] }],
            },
          }),
          { status: 200 }
        )
      )
    );

    const snap = await fetchOtxLookup(
      "8.8.8.8",
      "test-key",
      AbortSignal.timeout(5000)
    );

    expect(otxLookupSnapshotSchema.parse(snap).found).toBe(true);
    expect(snap.pulseCount).toBe(1);
    vi.unstubAllGlobals();
  });
});
