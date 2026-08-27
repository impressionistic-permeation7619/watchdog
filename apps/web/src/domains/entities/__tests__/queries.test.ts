import { describe, expect, it, vi } from "vitest";

import { GC_DEFAULT, STALE_DEFAULT } from "@/shared/lib/query-stale";

vi.mock("@/domains/entities/entities.functions", () => ({
  getEntityBySlugFn: vi.fn(),
  listEntitiesFn: vi.fn(),
}));

import {
  entitiesKeys,
  entitiesListQuery,
  entityBySlugQuery,
} from "@/domains/entities/queries";

describe("entities queries", () => {
  it("builds case-scoped entity keys", () => {
    expect(entitiesKeys.all("case-1")).toEqual(["entities", "case-1"]);
    expect(entitiesKeys.detail("case-1", "alpha")).toEqual([
      "entity",
      "case-1",
      "alpha",
    ]);
  });

  it("uses default stale and gc tiers for list and detail queries", () => {
    expect(entitiesListQuery("case-1")).toMatchObject({
      queryKey: entitiesKeys.all("case-1"),
      staleTime: STALE_DEFAULT,
      gcTime: GC_DEFAULT,
    });
    expect(entityBySlugQuery("case-1", "alpha")).toMatchObject({
      queryKey: entitiesKeys.detail("case-1", "alpha"),
      staleTime: STALE_DEFAULT,
      gcTime: GC_DEFAULT,
    });
  });
});
