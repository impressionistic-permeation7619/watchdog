import { describe, it, expect } from "vitest";

import {
  claimText,
  itRejectsIncompleteReport,
  testId,
} from "@watchdog/test-kit";

import { hackertargetLookup } from "../cap.ts";
import { interpretHackertargetLookupReport } from "../interpret.ts";

describe("interpret", () => {
  const entityId = testId(1);

  const fixture = {
    ip: "1.1.1.1",
    queriedAt: "2026-01-01T00:00:00.000Z",
    source: "api.hackertarget.com/reverseiplookup" as const,
    domains: ["one.one.one.one", "cloudflare-dns.com"],
    error: null,
  };

  it("interpretHackertargetLookupReport proposes domain Identifiers + Claim", () => {
    const result = interpretHackertargetLookupReport(fixture, {
      input: { ip: "1.1.1.1", entityId },
    });
    expect(result.patch.length).toBe(3);
    expect(result.patch[0]?.resource).toBe("identifier");
    expect(result.patch[0]?.data.type).toBe("domain");
    expect(result.patch[2]?.resource).toBe("claim");
    expect(claimText(result, 2)).toMatch(/2 host/);
  });

  itRejectsIncompleteReport(
    hackertargetLookup,
    { ip: "1.1.1.1" },
    { ip: "1.1.1.1" }
  );
});
