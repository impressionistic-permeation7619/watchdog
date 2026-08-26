import { describe, expect, it, vi } from "vitest";

const { fetchJsonObject } = vi.hoisted(() => ({
  fetchJsonObject: vi.fn(),
}));

vi.mock("../../http/fetch-json", () => ({
  fetchJsonObject,
}));

import {
  fetchUrlhausLookup,
  urlhausLookupSnapshotSchema,
} from "../urlhaus";

describe("urlhaus", () => {
  it("fetchUrlhausLookup maps host threat metadata", async () => {
    fetchJsonObject.mockResolvedValueOnce({
      query_status: "ok",
      urls: [
        {
          threat: "malware_download",
          url_status: "online",
          tags: ["emotet"],
          urlhaus_reference: "https://urlhaus.abuse.ch/host/1/",
        },
      ],
      firstseen: "2026-01-01",
    });

    const snap = await fetchUrlhausLookup(
      "evil.example",
      "test-key",
      AbortSignal.timeout(5000)
    );

    expect(urlhausLookupSnapshotSchema.parse(snap).found).toBe(true);
    expect(snap.threat).toBe("malware_download");
  });
});
