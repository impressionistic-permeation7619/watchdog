import { describe, it, expect } from "vitest";

import {
  claimText,
  itRejectsIncompleteReport,
  testId,
} from "@watchdog/test-kit";

import { censysLookup } from "../cap.ts";
import { interpretCensysLookupReport } from "../interpret.ts";

describe("interpret", () => {
  const entityId = testId(1);

  const fixture = {
    ip: "8.8.8.8",
    queriedAt: "2026-01-01T00:00:00.000Z",
    found: true,
    status: 200,
    asn: 15_169,
    asName: "GOOGLE",
    asCountryCode: "US",
    countryCode: "US",
    city: "Mountain View",
    ports: [53, 443],
    serviceNames: ["DNS", "HTTPS"],
    hostnames: ["dns.google"],
  };

  it("interpretCensysLookupReport proposes hostname Identifiers + Claim", () => {
    const result = interpretCensysLookupReport(fixture, {
      input: { ip: "8.8.8.8", entityId },
    });
    expect(result.patch[0]?.resource).toBe("identifier");
    expect(result.patch[0]?.data.type).toBe("domain");
    expect(claimText(result, 1)).toMatch(/15169/);
    expect(claimText(result, 1)).toMatch(/HTTPS/);
  });

  itRejectsIncompleteReport(censysLookup, { ip: "8.8.8.8" }, { ip: "8.8.8.8" });
});
