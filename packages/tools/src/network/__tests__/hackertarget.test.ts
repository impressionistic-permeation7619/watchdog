import { describe, expect, it, vi } from "vitest";

import {
  fetchHackertargetReverseIp,
  hackertargetLookupSnapshotSchema,
} from "../hackertarget";

describe("hackertarget", () => {
  it("parses reverse-IP snapshots", () => {
    const snap = hackertargetLookupSnapshotSchema.parse({
      ip: "8.8.8.8",
      queriedAt: "2026-01-01T00:00:00.000Z",
      source: "api.hackertarget.com/reverseiplookup",
      domains: ["dns.google"],
      error: null,
    });
    expect(snap.domains).toContain("dns.google");
  });

  it("fetchHackertargetReverseIp parses newline domain lists", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response("dns.google\none.one.one.one\n", { status: 200 })
      )
    );

    const snap = await fetchHackertargetReverseIp(
      "8.8.8.8",
      AbortSignal.timeout(5000)
    );

    expect(snap.domains).toContain("dns.google");
    expect(snap.error).toBeNull();
    vi.unstubAllGlobals();
  });
});
