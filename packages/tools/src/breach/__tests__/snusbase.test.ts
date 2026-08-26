import { describe, expect, it, vi } from "vitest";

const { fetchJsonObject } = vi.hoisted(() => ({
  fetchJsonObject: vi.fn(),
}));

vi.mock("../../http/fetch-json", () => ({
  fetchJsonObject,
}));

import {
  fetchSnusbaseLookup,
  snusbaseLookupSnapshotSchema,
} from "../snusbase";

describe("snusbase", () => {
  it("parses lookup snapshot schema", () => {
    const snap = snusbaseLookupSnapshotSchema.parse({
      query: "alice@mailhost.test",
      kind: "email",
      queriedAt: "2026-01-01T00:00:00.000Z",
      source: "api.snusbase.com",
      found: false,
      total: 0,
      tables: [],
      sampleCount: 0,
      entries: [],
    });
    expect(snap.kind).toBe("email");
  });

  it("fetchSnusbaseLookup flattens table results", async () => {
    fetchJsonObject.mockResolvedValueOnce({
      size: 1,
      results: {
        ExampleTable: [
          {
            email: "alice@mailhost.test",
            username: "alice",
          },
        ],
      },
    });

    const snap = await fetchSnusbaseLookup(
      "alice@mailhost.test",
      "test-key",
      AbortSignal.timeout(5000)
    );

    expect(snap.found).toBe(true);
    expect(snap.entries[0]?.email).toBe("alice@mailhost.test");
    expect(snap.tables[0]?.name).toBe("ExampleTable");
  });
});
