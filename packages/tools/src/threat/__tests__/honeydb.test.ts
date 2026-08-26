import { describe, expect, it, vi } from "vitest";

import {
  fetchHoneydbLookup,
  honeydbLookupSnapshotSchema,
} from "../honeydb";

describe("honeydb", () => {
  it("fetchHoneydbLookup maps ip-context payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            network_info: { asn: 15169, country: "US" },
            threat_info: { is_tor: false, is_threat: true },
            internet_scanner: false,
            ip_history: [{ event_count: 2 }],
          }),
          { status: 200 }
        )
      )
    );

    const snap = await fetchHoneydbLookup(
      "8.8.8.8",
      "id",
      "key",
      AbortSignal.timeout(5000)
    );

    expect(honeydbLookupSnapshotSchema.parse(snap).found).toBe(true);
    expect(snap.historyEventCount).toBe(2);
    vi.unstubAllGlobals();
  });
});
