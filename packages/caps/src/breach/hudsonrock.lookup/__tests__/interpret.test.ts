import { describe, it, expect } from "vitest";

import {
  claimText,
  itRejectsIncompleteReport,
  testId,
} from "@watchdog/test-kit";

import { hudsonrockLookup } from "../cap.ts";
import { interpretHudsonrockLookupReport } from "../interpret.ts";

describe("interpret", () => {
  const entityId = testId(1);

  const fixture = {
    query: "victim@example.com",
    kind: "email" as const,
    queriedAt: "2026-01-01T00:00:00.000Z",
    source: "api.hudsonrock.com" as const,
    found: true,
    totalResults: 2,
    newestDate: "2025-06-01",
  };

  it("interpretHudsonrockLookupReport proposes observation Claim", () => {
    const result = interpretHudsonrockLookupReport(fixture, {
      input: { query: fixture.query, entityId },
    });
    expect(result.patch.length).toBe(1);
    expect(claimText(result, 0)).toMatch(/Hudson Rock/);
    expect(claimText(result, 0)).toMatch(/infostealer exposure/);
    expect(claimText(result, 0)).toMatch(/2 exposure record\(s\)/);
    expect(claimText(result, 0)).not.toMatch(/password/i);
  });

  itRejectsIncompleteReport(
    hudsonrockLookup,
    { query: "victim@example.com" },
    { query: "victim@example.com" }
  );
});
