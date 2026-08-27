import { describe, expect, it, vi } from "vitest";

const { mockResolver } = vi.hoisted(() => ({
  mockResolver: {
    resolve4: vi.fn(),
    resolve6: vi.fn(),
    resolveMx: vi.fn(),
    resolveTxt: vi.fn(),
    resolveNs: vi.fn(),
  },
}));

vi.mock("../abortable-resolver", () => ({
  withAbortableResolver: vi.fn(() => ({
    resolver: mockResolver,
    cleanup: vi.fn(),
  })),
  assertNotAborted: vi.fn(),
}));

import { resolveDnsRecords } from "../resolve";

describe("resolveDnsRecords", () => {
  it("returns A/AAAA/MX/TXT/NS record sets", async () => {
    mockResolver.resolve4.mockResolvedValueOnce(["93.184.216.34"]);
    mockResolver.resolve6.mockResolvedValueOnce([]);
    mockResolver.resolveMx.mockResolvedValueOnce([
      { exchange: "mx.example.com", priority: 10 },
    ]);
    mockResolver.resolveTxt.mockResolvedValueOnce([["v=spf1 -all"]]);
    mockResolver.resolveNs.mockResolvedValueOnce(["ns.example.com"]);

    const records = await resolveDnsRecords(
      "example.com",
      AbortSignal.timeout(5000)
    );

    expect(records.host).toBe("example.com");
    expect(records.a).toContain("93.184.216.34");
    expect(records.mx[0]?.exchange).toBe("mx.example.com");
    expect(records.ns).toContain("ns.example.com");
  });
});
