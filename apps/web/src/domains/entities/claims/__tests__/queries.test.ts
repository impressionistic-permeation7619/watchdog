import { describe, expect, it, vi } from "vitest";

import { GC_DEFAULT, STALE_DEFAULT } from "@/shared/lib/query-stale";

vi.mock("@/domains/entities/claims/claims.functions", () => ({
  listClaimsFn: vi.fn(),
}));

import { claimsKeys, claimsListQuery } from "@/domains/entities/claims/queries";

describe("claims queries", () => {
  it("builds case- and entity-scoped keys", () => {
    expect(claimsKeys.prefix("case-1")).toEqual(["claims", "case-1"]);
    expect(claimsKeys.all("case-1", "ent-1")).toEqual([
      "claims",
      "case-1",
      "ent-1",
    ]);
  });

  it("uses default stale and gc tiers for entity claims", () => {
    expect(claimsListQuery("case-1", "ent-1")).toMatchObject({
      queryKey: claimsKeys.all("case-1", "ent-1"),
      staleTime: STALE_DEFAULT,
      gcTime: GC_DEFAULT,
    });
  });
});
