import { describe, it, expect } from "vitest";

import {
  expectNoConfidenceOnPatch,
  itRejectsIncompleteReport,
  testId,
} from "@watchdog/test-kit";

import { pgpLookup } from "../cap.ts";
import { interpretPgpLookupReport } from "../interpret.ts";

describe("interpret", () => {
  const entityId = testId(1);

  const fixture = {
    query: "alice@example.com",
    queriedAt: "2026-01-01T00:00:00.000Z",
    source: "https://keys.openpgp.org",
    keys: [
      {
        fingerprint: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        uids: ["Alice <alice@example.com>"],
        created: null,
        expires: null,
      },
    ],
  };

  it("interpretPgpLookupReport proposes pgp Identifier + Claim", () => {
    const result = interpretPgpLookupReport(fixture, {
      input: { query: "alice@example.com", entityId },
    });
    expect(result.patch.length).toBe(2);
    expect(result.patch[0]?.resource).toBe("identifier");
    expect(result.patch[0]?.data.type).toBe("pgp");
    expect(result.patch[1]?.resource).toBe("claim");
    expectNoConfidenceOnPatch(result);
  });

  itRejectsIncompleteReport(pgpLookup, { query: "x" }, { query: "x" });
});
