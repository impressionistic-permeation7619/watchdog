import { describe, expect, it, vi } from "vitest";

const { mockResolver } = vi.hoisted(() => ({
  mockResolver: {
    resolveMx: vi.fn(),
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

import {
  emailLookupSnapshotSchema,
  fetchEmailLookup,
  normalizeEmail,
} from "../email-lookup";

describe("email-lookup", () => {
  it("normalizeEmail lowercases and validates shape", () => {
    expect(normalizeEmail(" Alice@MailHost.Test ")).toEqual({
      email: "alice@mailhost.test",
      domain: "mailhost.test",
    });
    expect(() => normalizeEmail("not-an-email")).toThrow(/Invalid email/);
  });

  it("fetchEmailLookup resolves MX and SPF/DMARC presence", async () => {
    mockResolver.resolveMx.mockResolvedValueOnce([
      { exchange: "aspmx.l.google.com", priority: 1 },
    ]);
    mockResolver.resolveTxt.mockImplementation(async (name: string) => {
      if (name === "gmail.com")
        return [["v=spf1 include:_spf.google.com ~all"]];
      if (name === "_dmarc.gmail.com") return [["v=DMARC1; p=reject"]];
      return [];
    });

    const snap = await fetchEmailLookup(
      "alice@gmail.com",
      AbortSignal.timeout(5000)
    );

    expect(emailLookupSnapshotSchema.parse(snap).providerHint).toBe("google");
    expect(snap.spfPresent).toBe(true);
    expect(snap.dmarcPresent).toBe(true);
  });
});
