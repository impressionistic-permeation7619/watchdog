import { describe, expect, it, vi } from "vitest";

const { fetchJsonObject } = vi.hoisted(() => ({
  fetchJsonObject: vi.fn(),
}));

vi.mock("../../http/fetch-json", () => ({
  fetchJsonObject,
}));

import { fetchIpinfoLookup, ipinfoLookupSnapshotSchema } from "../ipinfo";

describe("ipinfo", () => {
  it("fetchIpinfoLookup maps JSON fields", async () => {
    fetchJsonObject.mockResolvedValueOnce({
      city: "Mountain View",
      region: "California",
      country: "US",
      org: "AS15169 Google LLC",
    });

    const snap = await fetchIpinfoLookup(
      "8.8.8.8",
      "token",
      AbortSignal.timeout(5000)
    );

    expect(ipinfoLookupSnapshotSchema.parse(snap).city).toBe("Mountain View");
    expect(snap.org).toContain("Google");
  });
});
