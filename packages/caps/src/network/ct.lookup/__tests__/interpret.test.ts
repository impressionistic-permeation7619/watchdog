import { describe, expect, it } from "vitest";

import {
  expectNoConfidenceOnPatch,
  expectProposesIdentifier,
  testId,
} from "@watchdog/test-kit";

import { ctLookup } from "../cap.ts";
import { interpretCtReport } from "../interpret.ts";

describe("interpretCtReport", () => {
  const entityId = testId(1);

  const fixture = {
    host: "example.com",
    source: "crt.sh" as const,
    queriedAt: "2026-01-01T00:00:00.000Z",
    entries: [
      {
        commonName: "www.example.com",
        nameValue: "www.example.com\napi.example.com",
        issuer: "Test CA",
        notBefore: "2025-01-01",
        notAfter: "2026-01-01",
        serial: "1",
      },
    ],
    domains: ["example.com", "www.example.com", "api.example.com"],
  };

  it("proposes domain identifiers when entityId is set", () => {
    const result = interpretCtReport(fixture, {
      input: { host: "example.com", entityId },
    });
    expectProposesIdentifier(result, { type: "domain", value: "example.com" });
    expectProposesIdentifier(result, {
      type: "domain",
      value: "www.example.com",
    });
    expectProposesIdentifier(result, {
      type: "domain",
      value: "api.example.com",
    });
    expect(
      result.patch.filter((p) => p.resource === "identifier")
    ).toHaveLength(3);
    expect(result.patch.filter((p) => p.resource === "claim")).toHaveLength(1);
    expectNoConfidenceOnPatch(result);
  });

  it("dedupes duplicate domains", () => {
    const result = interpretCtReport(
      { ...fixture, domains: ["example.com", "example.com", "EXAMPLE.COM"] },
      { input: { host: "example.com", entityId } }
    );
    const ids = result.patch.filter((p) => p.resource === "identifier");
    expect(ids).toHaveLength(1);
    expect(ids[0]?.data.value).toBe("example.com");
  });

  it("emits an empty patch when entityId is omitted", () => {
    const result = interpretCtReport(
      {
        host: "example.com",
        source: "crt.sh",
        queriedAt: "2026-01-01T00:00:00.000Z",
        entries: [],
        domains: ["example.com"],
      },
      { input: { host: "example.com" } }
    );
    expect(result.patch).toHaveLength(0);
    expect(String(result.summary)).toMatch(/no Entity/i);
  });
});

describe("ctLookup.handoff", () => {
  it("drops wildcard hosts", () => {
    const bag = ctLookup.handoff?.({
      host: "example.com",
      source: "crt.sh",
      queriedAt: "2026-01-01T00:00:00.000Z",
      entries: [],
      domains: [
        "*.example.com",
        "www.example.com",
        "api.*.example.com",
        "WWW.example.com",
      ],
    });
    expect(bag).toEqual({ host: ["www.example.com"] });
  });
});
