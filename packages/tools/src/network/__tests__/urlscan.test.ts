import { describe, expect, it, vi } from "vitest";

const { fetchJsonObject } = vi.hoisted(() => ({
  fetchJsonObject: vi.fn(),
}));

vi.mock("../../http/fetch-json", () => ({
  fetchJsonObject,
}));

import { fetchUrlscanSearch, urlscanLookupSnapshotSchema } from "../urlscan";

describe("urlscan search", () => {
  it("fetchUrlscanSearch maps search hits", async () => {
    fetchJsonObject.mockResolvedValueOnce({
      total: 1,
      results: [
        {
          task: {
            uuid: "scan-1",
            url: "https://example.com/",
            time: "2026-01-01T00:00:00.000Z",
          },
          page: {
            domain: "example.com",
            ip: "93.184.216.34",
            url: "https://example.com/",
          },
          result: "https://urlscan.io/result/scan-1/",
        },
      ],
    });

    const snap = await fetchUrlscanSearch(
      "example.com",
      AbortSignal.timeout(5000)
    );

    expect(urlscanLookupSnapshotSchema.parse(snap).hits).toHaveLength(1);
    expect(snap.urls).toContain("https://example.com/");
  });
});
