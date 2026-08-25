import { describe, it, expect } from "vitest";

import {
  claimText,
  itRejectsIncompleteReport,
  testId,
} from "@watchdog/test-kit";

import { trancoLookup } from "../cap.ts";
import { interpretTrancoLookupReport } from "../interpret.ts";

describe("interpret", () => {
  const entityId = testId(1);

  const foundFixture = {
    domain: "example.com",
    queriedAt: "2026-01-01T00:00:00.000Z",
    source: "tranco-list.eu" as const,
    found: true,
    latestRank: 12_345,
    latestDate: "2026-01-01",
    ranksCount: 30,
  };

  const notFoundFixture = {
    domain: "example.com",
    queriedAt: "2026-01-01T00:00:00.000Z",
    source: "tranco-list.eu" as const,
    found: false,
    latestRank: null,
    latestDate: null,
    ranksCount: 0,
  };

  it("interpretTrancoLookupReport proposes observation Claim with rank", () => {
    const result = interpretTrancoLookupReport(foundFixture, {
      input: { host: foundFixture.domain, entityId },
    });
    expect(result.patch.length).toBe(1);
    expect(claimText(result, 0)).toMatch(/rank 12345/);
  });

  it("interpretTrancoLookupReport reports out-of-top-1M softly", () => {
    const result = interpretTrancoLookupReport(notFoundFixture, {
      input: { host: notFoundFixture.domain, entityId },
    });
    expect(claimText(result, 0)).toMatch(/not in the top-1M/);
  });

  itRejectsIncompleteReport(
    trancoLookup,
    { domain: "example.com" },
    { host: "example.com" }
  );
});
