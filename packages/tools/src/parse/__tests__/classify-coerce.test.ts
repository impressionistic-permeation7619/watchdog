import { describe, expect, it } from "vitest";

import { classifyBreachQuery } from "../classify-breach-query.ts";
import { classifyIpOrHost } from "../classify-ip-or-host.ts";
import { asBool, asNumber, asString, isRecord, recordRows } from "../coerce.ts";

describe("classifyBreachQuery", () => {
  it("classifies email, ip, and username", () => {
    expect(classifyBreachQuery("Ada@MailHost.test")).toEqual({
      kind: "email",
      value: "ada@mailhost.test",
    });
    expect(classifyBreachQuery("8.8.8.8").kind).toBe("ip");
  });
});

describe("classifyIpOrHost", () => {
  it("normalizes a domain", () => {
    expect(classifyIpOrHost("HTTPS://MailHost.test/path")).toEqual({
      kind: "domain",
      value: "mailhost.test",
    });
  });
});

describe("coerce", () => {
  it("narrows records and booleans", () => {
    expect(isRecord({ a: 1 })).toBe(true);
    expect(isRecord([1])).toBe(false);
    expect(recordRows([{ a: 1 }, 2])).toEqual([{ a: 1 }]);
    expect(asString("  x  ")).toBe("x");
    expect(asBool("yes")).toBe(true);
    expect(asNumber("15169")).toBe(15_169);
    expect(asNumber(15_169)).toBe(15_169);
  });
});
