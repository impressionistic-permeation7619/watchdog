import { describe, expect, it, vi } from "vitest";

const { fetchJsonObject } = vi.hoisted(() => ({
  fetchJsonObject: vi.fn(),
}));

vi.mock("../../http/fetch-json", () => ({
  fetchJsonObject,
}));

import {
  dehashedEntrySchema,
  dehashedLookupSnapshotSchema,
  fetchDehashedLookup,
} from "../dehashed";

describe("dehashed", () => {
  it("parses entry and snapshot schemas", () => {
    const entry = dehashedEntrySchema.parse({
      databaseName: "ExampleDump",
      email: "alice@mailhost.test",
      username: null,
      ipAddress: null,
      name: null,
      phone: null,
      password: null,
      hashedPassword: null,
    });
    expect(entry.email).toBe("alice@mailhost.test");

    const snap = dehashedLookupSnapshotSchema.parse({
      query: "alice@mailhost.test",
      kind: "email",
      queriedAt: "2026-01-01T00:00:00.000Z",
      source: "api.dehashed.com",
      found: false,
      total: 0,
      balance: null,
      databases: [],
      sampleCount: 0,
      entries: [],
    });
    expect(snap.found).toBe(false);
  });

  it("fetchDehashedLookup maps API hits for email queries", async () => {
    fetchJsonObject.mockResolvedValueOnce({
      entries: [
        {
          database_name: "ExampleDump",
          email: "alice@mailhost.test",
        },
      ],
      total: 1,
      balance: 10,
    });

    const snap = await fetchDehashedLookup(
      "alice@mailhost.test",
      "test-key",
      AbortSignal.timeout(5000)
    );

    expect(snap.kind).toBe("email");
    expect(snap.found).toBe(true);
    expect(snap.entries[0]?.email).toBe("alice@mailhost.test");
  });
});
