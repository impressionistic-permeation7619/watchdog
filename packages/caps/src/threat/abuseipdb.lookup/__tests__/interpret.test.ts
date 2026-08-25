import { describe, it, expect } from "vitest";

import {
  claimText,
  itRejectsIncompleteReport,
  testId,
} from "@watchdog/test-kit";

import { abuseIpdbLookup } from "../cap.ts";
import { interpretAbuseIpdbLookupReport } from "../interpret.ts";

describe("interpret", () => {
  const entityId = testId(1);

  const fixture = {
    ip: "203.0.113.10",
    queriedAt: "2026-01-01T00:00:00.000Z",
    found: true,
    status: 200,
    abuseConfidenceScore: 42,
    totalReports: 15,
    numDistinctUsers: 8,
    lastReportedAt: "2025-12-01T00:00:00.000Z",
    isPublic: true,
    isWhitelisted: false,
    isp: "Example ISP",
    domain: "example.com",
    usageType: "Data Center/Web Hosting/Transit",
    countryCode: "US",
  };

  it("interpretAbuseIpdbLookupReport proposes domain Identifier + Claim", () => {
    const result = interpretAbuseIpdbLookupReport(fixture, {
      input: { ip: "203.0.113.10", entityId },
    });
    expect(result.patch[0]?.resource).toBe("identifier");
    expect(result.patch[0]?.data.type).toBe("domain");
    expect(result.patch[1]?.resource).toBe("claim");
    expect(claimText(result, 1)).toMatch(/confidence=42%/);
    expect(claimText(result, 1)).toMatch(/reports=15/);
    expect(claimText(result, 1)).toMatch(/isp=Example ISP/);
  });

  itRejectsIncompleteReport(
    abuseIpdbLookup,
    { ip: "203.0.113.10" },
    { ip: "203.0.113.10" }
  );
});
