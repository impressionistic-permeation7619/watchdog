import { describe, expect, it, vi } from "vitest";

import { GC_DEFAULT, STALE_DEFAULT } from "@/shared/lib/query-stale";

vi.mock("@/domains/entities/identifiers/identifiers.functions", () => ({
  listIdentifiersFn: vi.fn(),
  listIdentifiersForCaseFn: vi.fn(),
}));

import {
  identifiersForCaseQuery,
  identifiersKeys,
  identifiersListQuery,
} from "@/domains/entities/identifiers/queries";

describe("identifiers queries", () => {
  it("builds entity and case-wide keys", () => {
    expect(identifiersKeys.prefix("case-1")).toEqual(["identifiers", "case-1"]);
    expect(identifiersKeys.all("case-1", "ent-1")).toEqual([
      "identifiers",
      "case-1",
      "ent-1",
    ]);
    expect(identifiersKeys.forCase("case-1")).toEqual([
      "identifiers",
      "case-1",
      "case",
    ]);
  });

  it("uses default stale and gc tiers for list queries", () => {
    expect(identifiersListQuery("case-1", "ent-1")).toMatchObject({
      queryKey: identifiersKeys.all("case-1", "ent-1"),
      staleTime: STALE_DEFAULT,
      gcTime: GC_DEFAULT,
    });
    expect(identifiersForCaseQuery("case-1")).toMatchObject({
      queryKey: identifiersKeys.forCase("case-1"),
      staleTime: STALE_DEFAULT,
      gcTime: GC_DEFAULT,
    });
  });
});
