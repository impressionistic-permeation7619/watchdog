import { describe, expect, it, vi } from "vitest";

const { fetchJsonObject } = vi.hoisted(() => ({
  fetchJsonObject: vi.fn(),
}));

vi.mock("../../http/fetch-json", () => ({
  fetchJsonObject,
}));

import {
  fetchGreynoiseCommunity,
  greynoiseLookupSnapshotSchema,
} from "../greynoise";

describe("greynoise", () => {
  it("fetchGreynoiseCommunity maps community responses", async () => {
    fetchJsonObject.mockResolvedValueOnce({
      ip: "8.8.8.8",
      noise: false,
      riot: true,
      classification: "benign",
      name: "Google Public DNS",
    });

    const snap = await fetchGreynoiseCommunity(
      "8.8.8.8",
      AbortSignal.timeout(5000)
    );

    expect(greynoiseLookupSnapshotSchema.parse(snap).found).toBe(true);
    expect(snap.riot).toBe(true);
  });
});
