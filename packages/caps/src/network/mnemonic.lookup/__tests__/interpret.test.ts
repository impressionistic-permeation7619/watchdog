import { describe, it, expect } from "vitest";

import {
  claimText,
  itRejectsIncompleteReport,
  testId,
} from "@watchdog/test-kit";

import { mnemonicLookup } from "../cap.ts";
import { interpretMnemonicLookupReport } from "../interpret.ts";

describe("interpret", () => {
  const entityId = testId(1);

  const fixture = {
    query: "8.8.8.8",
    kind: "ip" as const,
    queriedAt: "2026-01-01T00:00:00.000Z",
    source: "api.mnemonic.no/pdns/v3" as const,
    count: 10,
    records: [
      {
        query: "dns.google",
        answer: "8.8.8.8",
        rrtype: "a",
        times: 5,
        firstSeenAt: "2025-01-01T00:00:00.000Z",
        lastSeenAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    domains: ["dns.google"],
    ips: [],
  };

  it("interpretMnemonicLookupReport proposes domain Identifiers", () => {
    const result = interpretMnemonicLookupReport(fixture, {
      input: { query: "8.8.8.8", entityId },
    });
    expect(result.patch.length).toBe(2);
    expect(result.patch[0]?.resource).toBe("identifier");
    expect(result.patch[0]?.data.type).toBe("domain");
    expect(claimText(result, 1)).toMatch(/Mnemonic PDNS/);
  });

  it("interpretMnemonicLookupReport also proposes PDNS IPs", () => {
    const result = interpretMnemonicLookupReport(
      {
        ...fixture,
        kind: "domain",
        query: "dns.google",
        ips: ["8.8.8.8"],
        domains: ["dns.google"],
      },
      { input: { query: "dns.google", entityId } }
    );
    const ids = result.patch.filter((p) => p.resource === "identifier");
    const types = ids.flatMap((p) => {
      const type = p.data.type;
      return typeof type === "string" ? [type] : [];
    });
    expect(types.sort((a, b) => a.localeCompare(b))).toEqual(["domain", "ip"]);
  });

  itRejectsIncompleteReport(
    mnemonicLookup,
    { query: "8.8.8.8" },
    { query: "8.8.8.8" }
  );
});
