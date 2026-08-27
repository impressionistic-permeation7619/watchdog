import { describe, expect, it, vi } from "vitest";

const { mockResolver } = vi.hoisted(() => ({
  mockResolver: {
    resolveTxt: vi.fn(),
  },
}));

vi.mock("../../dns/abortable-resolver", () => ({
  withAbortableResolver: vi.fn(() => ({
    resolver: mockResolver,
    cleanup: vi.fn(),
  })),
  assertNotAborted: vi.fn(),
}));

import { fetchIpLookup, ipLookupSnapshotSchema } from "../ip-lookup";

describe("ip-lookup", () => {
  it("fetchIpLookup parses Team Cymru origin TXT", async () => {
    mockResolver.resolveTxt.mockImplementation(async (name: string) => {
      if (name.endsWith("origin.asn.cymru.com")) {
        return [["15169 | 8.8.8.0/24 | US | arin | 2000-03-30"]];
      }
      if (name === "AS15169.asn.cymru.com") {
        return [["15169 | US | arin | 2000-03-30 | GOOGLE - Google LLC"]];
      }
      return [];
    });

    const snap = await fetchIpLookup("8.8.8.8", AbortSignal.timeout(5000));

    expect(ipLookupSnapshotSchema.parse(snap).asn).toBe("15169");
    expect(snap.asName).toContain("GOOGLE");
  });
});
