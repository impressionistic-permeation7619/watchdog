import { describe, expect, it, vi } from "vitest";

const { mockResolver } = vi.hoisted(() => ({
  mockResolver: {
    resolveMx: vi.fn(),
    resolveTxt: vi.fn(),
  },
}));

vi.mock("../abortable-resolver", () => ({
  withAbortableResolver: vi.fn(() => ({
    resolver: mockResolver,
    cleanup: vi.fn(),
  })),
  assertNotAborted: vi.fn(),
}));

import { fetchMailConfig } from "../mail-config";

describe("fetchMailConfig", () => {
  it("collects MX and SPF records from DNS", async () => {
    mockResolver.resolveMx.mockResolvedValueOnce([
      { exchange: "mx.example.com", priority: 10 },
    ]);
    mockResolver.resolveTxt.mockImplementation(async (name: string) => {
      if (name === "example.com") return [["v=spf1 -all"]];
      if (name === "_dmarc.example.com") return [];
      return [];
    });

    const snap = await fetchMailConfig(
      "example.com",
      AbortSignal.timeout(5000),
      { dkimSelectors: ["default"] }
    );

    expect(snap.host).toBe("example.com");
    expect(snap.spf.present).toBe(true);
    expect(snap.mx[0]?.exchange).toBe("mx.example.com");
  });
});
