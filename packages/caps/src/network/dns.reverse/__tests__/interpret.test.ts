import { describe, it, expect } from "vitest";

import {
  claimText,
  itRejectsIncompleteReport,
  testId,
} from "@watchdog/test-kit";

import { dnsReverse } from "../cap.ts";
import { interpretDnsReverseReport } from "../interpret.ts";

describe("interpret", () => {
  const entityId = testId(1);

  const fixture = {
    ip: "8.8.8.8",
    queriedAt: "2026-01-01T00:00:00.000Z",
    hostnames: ["dns.google"],
  };

  it("interpretDnsReverseReport proposes domain Identifier + Claim", () => {
    const result = interpretDnsReverseReport(fixture, {
      input: { ip: "8.8.8.8", entityId },
    });
    expect(result.patch.length).toBe(2);
    expect(result.patch[0]?.resource).toBe("identifier");
    expect(result.patch[0]?.data.type).toBe("domain");
    expect(result.patch[0]?.data.value).toBe("dns.google");
    expect(result.patch[1]?.resource).toBe("claim");
    expect(claimText(result, 1)).toMatch(/dns\.google/);
  });

  it("interpretDnsReverseReport empty patch without entityId", () => {
    const result = interpretDnsReverseReport(fixture, {
      input: { ip: "8.8.8.8" },
    });
    expect(result.patch).toEqual([]);
  });

  itRejectsIncompleteReport(dnsReverse, { ip: "8.8.8.8" }, { ip: "8.8.8.8" });
});
