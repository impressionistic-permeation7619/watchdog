import { describe, it, expect } from "vitest";

import {
  claimText,
  itRejectsIncompleteReport,
  testId,
} from "@watchdog/test-kit";

import { leakixLookup } from "../cap.ts";
import { interpretLeakixLookupReport } from "../interpret.ts";

describe("interpret", () => {
  const entityId = testId(1);

  const fixture = {
    query: "1.2.3.4",
    kind: "ip" as const,
    queriedAt: "2026-01-01T00:00:00.000Z",
    source: "leakix.net" as const,
    found: true,
    serviceCount: 3,
    leakCount: 1,
    protocols: ["https", "ssh"],
    hostnames: ["evil.example"],
  };

  it("interpretLeakixLookupReport proposes hostname Identifiers + Claim", () => {
    const result = interpretLeakixLookupReport(fixture, {
      input: { query: fixture.query, entityId },
    });
    expect(result.patch[0]?.resource).toBe("identifier");
    expect(result.patch[0]?.data.type).toBe("domain");
    expect(claimText(result, 1)).toMatch(/LeakIX/);
    expect(claimText(result, 1)).toMatch(/3 service\(s\)/);
  });

  itRejectsIncompleteReport(
    leakixLookup,
    { query: "1.2.3.4" },
    { query: "1.2.3.4" }
  );
});
