import { describe, it, expect } from "vitest";

import {
  claimText,
  itRejectsIncompleteReport,
  testId,
} from "@watchdog/test-kit";

import { shodanLookup } from "../cap.ts";
import { interpretShodanLookupReport } from "../interpret.ts";

describe("interpret", () => {
  const entityId = testId(1);

  const fixture = {
    ip: "8.8.8.8",
    queriedAt: "2026-01-01T00:00:00.000Z",
    found: true,
    status: 200,
    org: "Google LLC",
    isp: "Google LLC",
    asn: "AS15169",
    hostnames: ["dns.google"],
    ports: [53, 443],
    tags: [],
    os: null,
    countryCode: "US",
    city: "Mountain View",
    lastUpdate: "2026-01-01T00:00:00.000Z",
  };

  it("interpretShodanLookupReport proposes domain Identifier + Claim", () => {
    const result = interpretShodanLookupReport(fixture, {
      input: { ip: "8.8.8.8", entityId },
    });
    expect(result.patch.length).toBe(2);
    expect(result.patch[0]?.resource).toBe("identifier");
    expect(result.patch[0]?.data.type).toBe("domain");
    expect(result.patch[0]?.data.value).toBe("dns.google");
    expect(result.patch[1]?.resource).toBe("claim");
    expect(claimText(result, 1)).toMatch(/Google LLC/);
    expect(claimText(result, 1)).toMatch(/53/);
  });

  itRejectsIncompleteReport(shodanLookup, { ip: "8.8.8.8" }, { ip: "8.8.8.8" });
});
