import { describe, it, expect } from "vitest";

import {
  claimText,
  itRejectsIncompleteReport,
  testId,
} from "@watchdog/test-kit";

import { safebrowsingLookup } from "../cap.ts";
import { interpretSafebrowsingLookupReport } from "../interpret.ts";

describe("interpret", () => {
  const entityId = testId(1);

  const fixture = {
    url: "http://malicious.example.com/",
    queriedAt: "2026-01-01T00:00:00.000Z",
    source: "safebrowsing.googleapis.com" as const,
    found: true,
    matches: [{ threatType: "MALWARE", platformType: "ANY_PLATFORM" }],
  };

  it("interpretSafebrowsingLookupReport proposes observation Claim", () => {
    const result = interpretSafebrowsingLookupReport(fixture, {
      input: { url: fixture.url, entityId },
    });
    expect(result.patch.length).toBe(1);
    expect(claimText(result, 0)).toMatch(/Safe Browsing/);
    expect(claimText(result, 0)).toMatch(/MALWARE/);
  });

  itRejectsIncompleteReport(
    safebrowsingLookup,
    { url: "http://x.example.com" },
    { url: "http://x.example.com" }
  );
});
