import { describe, expect, it, vi } from "vitest";

import {
  fetchPgpLookup,
  parseHkpMrIndex,
  pgpLookupSnapshotSchema,
} from "../pgp-lookup";

describe("pgp-lookup", () => {
  it("parseHkpMrIndex reads pub and uid lines", () => {
    const body = [
      "pub:2048:22:ABCDEF0123456789:DEADBEEF:1609459200:0:",
      "uid:Alice <alice@mailhost.test>",
    ].join("\n");
    const keys = parseHkpMrIndex(body);
    expect(keys[0]?.fingerprint).toBe("DEADBEEF");
    expect(keys[0]?.uids[0]).toContain("alice@mailhost.test");
  });

  it("fetchPgpLookup returns keys from the first successful keyserver", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(
            "pub:2048:22:ABCDEF0123456789:DEADBEEF:1609459200:0:\nuid:Alice",
            { status: 200 }
          )
        )
    );

    const snap = await fetchPgpLookup(
      "alice@mailhost.test",
      AbortSignal.timeout(5000)
    );

    expect(pgpLookupSnapshotSchema.parse(snap).keys).toHaveLength(1);
    vi.unstubAllGlobals();
  });
});
