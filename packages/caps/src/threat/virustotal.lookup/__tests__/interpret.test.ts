import { describe, it, expect } from "vitest";

import {
  claimText,
  itRejectsIncompleteReport,
  testId,
} from "@watchdog/test-kit";

import { virusTotalLookup } from "../cap.ts";
import { interpretVirusTotalLookupReport } from "../interpret.ts";

describe("interpret", () => {
  const entityId = testId(1);

  const fixture = {
    query: "8.8.8.8",
    kind: "ip" as const,
    queriedAt: "2026-01-01T00:00:00.000Z",
    found: true,
    status: 200,
    reputation: 0,
    malicious: 0,
    suspicious: 0,
    harmless: 60,
    undetected: 30,
    asOwner: "Google LLC",
    asn: 15_169,
    country: "US",
    network: "8.8.8.0/24",
    registrar: null,
  };

  it("interpretVirusTotalLookupReport proposes Claim only", () => {
    const result = interpretVirusTotalLookupReport(fixture, {
      input: { query: "8.8.8.8", entityId },
    });
    expect(result.patch.length).toBe(1);
    expect(result.patch[0]?.resource).toBe("claim");
    expect(claimText(result, 0)).toMatch(/VirusTotal/);
    expect(claimText(result, 0)).toMatch(/reputation=0/);
    expect(claimText(result, 0)).toMatch(/harmless=60/);
    expect(claimText(result, 0)).toMatch(/undetected=30/);
    expect(claimText(result, 0)).toMatch(/asn=15169/);
  });

  itRejectsIncompleteReport(
    virusTotalLookup,
    { query: "8.8.8.8" },
    { query: "8.8.8.8" }
  );
});
