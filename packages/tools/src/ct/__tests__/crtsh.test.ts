import { describe, it, expect } from "vitest";

import { extractDomainsFromNameValue, parseCrtShJson } from "../crtsh.ts";

describe("crtsh", () => {
  it("extractDomainsFromNameValue splits SANs and strips wildcards", () => {
    const domains = extractDomainsFromNameValue(
      "*.Example.COM\napi.example.com\nbob@example.com"
    );
    expect(domains.includes("example.com")).toBeTruthy();
    expect(domains.includes("api.example.com")).toBeTruthy();
    expect(!domains.some((d) => d.includes("@"))).toBeTruthy();
  });

  it("parseCrtShJson unwraps concatenated }{ objects", () => {
    const rows = parseCrtShJson(
      '{"common_name":"a.example.com","serial_number":"1"}{"common_name":"b.example.com","serial_number":"2"}'
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ common_name: "a.example.com" });
  });
});
