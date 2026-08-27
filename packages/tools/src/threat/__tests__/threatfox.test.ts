import { describe, expect, it, vi } from "vitest";

const { fetchJsonObject } = vi.hoisted(() => ({
  fetchJsonObject: vi.fn(),
}));

vi.mock("../../http/fetch-json", () => ({
  fetchJsonObject,
}));

import {
  fetchThreatfoxLookup,
  threatfoxLookupSnapshotSchema,
} from "../threatfox";

describe("threatfox", () => {
  it("fetchThreatfoxLookup maps IOC search results", async () => {
    fetchJsonObject.mockResolvedValueOnce({
      query_status: "ok",
      data: [
        {
          id: "1",
          ioc: "8.8.8.8",
          threat_type: "botnet_cc",
          malware: "emotet",
          tags: ["emotet"],
        },
      ],
    });

    const snap = await fetchThreatfoxLookup(
      "8.8.8.8",
      "test-key",
      AbortSignal.timeout(5000)
    );

    expect(threatfoxLookupSnapshotSchema.parse(snap).found).toBe(true);
    expect(snap.iocs[0]?.ioc).toBe("8.8.8.8");
  });
});
