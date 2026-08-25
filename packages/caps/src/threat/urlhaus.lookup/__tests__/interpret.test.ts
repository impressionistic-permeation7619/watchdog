import { describe, it, expect } from "vitest";

import {
  claimText,
  itRejectsIncompleteReport,
  testId,
} from "@watchdog/test-kit";

import { urlhausLookup } from "../cap.ts";
import { interpretUrlhausLookupReport } from "../interpret.ts";

describe("interpret", () => {
  const entityId = testId(1);

  const fixture = {
    query: "http://evil.example/bad.exe",
    kind: "url" as const,
    queriedAt: "2026-01-01T00:00:00.000Z",
    source: "urlhaus-api.abuse.ch" as const,
    queryStatus: "ok",
    found: true,
    threat: "malware_download",
    urlStatus: "online",
    tags: ["exe", "emotet"],
    urlhausReference: "https://urlhaus.abuse.ch/url/12345/",
    firstSeen: "2026-01-01 00:00:00",
  };

  it("interpretUrlhausLookupReport proposes url Identifier + Claim on a URL hit", () => {
    const result = interpretUrlhausLookupReport(fixture, {
      input: { query: fixture.query, entityId },
    });
    expect(result.patch[0]?.resource).toBe("identifier");
    expect(result.patch[0]?.data.type).toBe("url");
    expect(claimText(result, 1)).toMatch(/URLhaus/);
    expect(claimText(result, 1)).toMatch(/malware_download/);
  });

  itRejectsIncompleteReport(
    urlhausLookup,
    { query: fixture.query },
    { query: fixture.query }
  );
});
