import { describe, it, expect } from "vitest";

import {
  claimText,
  itRejectsIncompleteReport,
  testId,
} from "@watchdog/test-kit";

import { c99Lookup } from "../cap.ts";
import { interpretC99LookupReport } from "../interpret.ts";

describe("interpret", () => {
  const entityId = testId(1);

  const fixture = {
    host: "example.com",
    queriedAt: "2026-01-01T00:00:00.000Z",
    source: "api.c99.nl/subdomainfinder" as const,
    realtime: false,
    domains: ["www.example.com", "mail.example.com"],
    hits: [
      {
        subdomain: "www.example.com",
        ip: "93.184.216.34",
        cloudflare: false,
      },
      {
        subdomain: "mail.example.com",
        ip: "93.184.216.34",
        cloudflare: true,
      },
    ],
    error: null,
  };

  it("interpretC99LookupReport proposes domain Identifiers + Claim", () => {
    const result = interpretC99LookupReport(fixture, {
      input: { host: "example.com", entityId },
    });
    expect(result.patch.length).toBe(3);
    expect(result.patch[0]?.resource).toBe("identifier");
    expect(result.patch[0]?.data.type).toBe("domain");
    expect(result.patch[1]?.resource).toBe("identifier");
    expect(result.patch[2]?.resource).toBe("claim");
    expect(claimText(result, 2)).toMatch(/cloudflare=1/);
  });

  itRejectsIncompleteReport(
    c99Lookup,
    { host: "example.com" },
    { host: "example.com" }
  );
});
