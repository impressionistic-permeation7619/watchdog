import { describe, expect, it } from "vitest";

import { parseExitAddresses } from "../tor-exit";

describe("tor-exit", () => {
  it("parseExitAddresses extracts normalized exit IPs", () => {
    const text = [
      "Published 2026-01-01 00:00:00",
      "ExitAddress 1.2.3.4 2026-01-01 00:00:00",
      "ExitAddress 5.6.7.8 2026-01-01 00:00:00",
    ].join("\n");
    const ips = parseExitAddresses(text);
    expect(ips.has("1.2.3.4")).toBe(true);
    expect(ips.has("5.6.7.8")).toBe(true);
  });
});
