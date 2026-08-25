import { describe, it, expect } from "vitest";

import {
  claimText,
  itRejectsIncompleteReport,
  testId,
} from "@watchdog/test-kit";

import { otxLookup } from "../cap.ts";
import { interpretOtxLookupReport } from "../interpret.ts";

describe("interpret", () => {
  const entityId = testId(1);

  const fixture = {
    query: "1.2.3.4",
    kind: "ip" as const,
    queriedAt: "2026-01-01T00:00:00.000Z",
    source: "otx.alienvault.com" as const,
    found: true,
    pulseCount: 3,
    pulseNames: ["Emotet campaign", "Cobalt Strike infra"],
    malwareFamilies: ["Emotet", "Cobalt Strike"],
  };

  it("interpretOtxLookupReport proposes observation Claim", () => {
    const result = interpretOtxLookupReport(fixture, {
      input: { query: "1.2.3.4", entityId },
    });
    expect(result.patch.length).toBe(1);
    expect(claimText(result, 0)).toMatch(/OTX \(AlienVault\)/);
    expect(claimText(result, 0)).toMatch(/Emotet/);
    expect(claimText(result, 0)).toMatch(/pulses: Emotet campaign/);
  });

  itRejectsIncompleteReport(
    otxLookup,
    { query: "1.2.3.4" },
    { query: "1.2.3.4" }
  );
});
