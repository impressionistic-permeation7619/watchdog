import { describe, it, expect } from "vitest";

import {
  claimText,
  itRejectsIncompleteReport,
  testId,
} from "@watchdog/test-kit";

import { greynoiseLookup } from "../cap.ts";
import { interpretGreynoiseLookupReport } from "../interpret.ts";

describe("interpret", () => {
  const entityId = testId(1);

  const fixture = {
    ip: "1.2.3.4",
    queriedAt: "2026-01-01T00:00:00.000Z",
    source: "api.greynoise.io/v3/community" as const,
    found: true,
    noise: true,
    riot: false,
    classification: "malicious",
    name: null,
    link: "https://viz.greynoise.io/ip/1.2.3.4",
    lastSeen: "2026-01-01",
    message: null,
    authenticated: true,
  };

  it("interpretGreynoiseLookupReport proposes observation Claim", () => {
    const result = interpretGreynoiseLookupReport(fixture, {
      input: { ip: "1.2.3.4", entityId },
    });
    expect(result.patch.length).toBe(1);
    expect(claimText(result, 0)).toMatch(/noise=true/);
  });

  itRejectsIncompleteReport(
    greynoiseLookup,
    { ip: "1.2.3.4" },
    { ip: "1.2.3.4" }
  );
});
