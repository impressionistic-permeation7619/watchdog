import { describe, it, expect } from "vitest";

import {
  claimText,
  itRejectsIncompleteReport,
  testId,
} from "@watchdog/test-kit";

import { threatfoxLookup } from "../cap.ts";
import { interpretThreatfoxLookupReport } from "../interpret.ts";

describe("interpret", () => {
  const entityId = testId(1);

  const fixture = {
    query: "1.2.3.4",
    kind: "ip" as const,
    queriedAt: "2026-01-01T00:00:00.000Z",
    source: "threatfox-api.abuse.ch" as const,
    queryStatus: "ok",
    found: true,
    iocs: [
      {
        id: "1",
        ioc: "1.2.3.4",
        iocType: "ip:port",
        threatType: "botnet_cc",
        malware: "win.emotet",
        malwarePrintable: "Emotet",
        confidenceLevel: 90,
        firstSeen: "2026-01-01 00:00:00",
        lastSeen: null,
        tags: ["emotet"],
      },
    ],
  };

  it("interpretThreatfoxLookupReport proposes typed IOC Identifiers + Claim", () => {
    const result = interpretThreatfoxLookupReport(fixture, {
      input: { query: "1.2.3.4", entityId },
    });
    expect(result.patch[0]?.resource).toBe("identifier");
    expect(result.patch[0]?.data.type).toBe("ip");
    expect(result.patch[0]?.data.value).toBe("1.2.3.4");
    expect(claimText(result, 1)).toMatch(/abuse\.ch/);
    expect(claimText(result, 1)).toMatch(/Emotet/);
  });

  itRejectsIncompleteReport(
    threatfoxLookup,
    { query: "1.2.3.4" },
    { query: "1.2.3.4" }
  );
});
