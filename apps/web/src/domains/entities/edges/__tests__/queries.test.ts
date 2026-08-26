import { describe, expect, it, vi } from "vitest";

import { GC_DEFAULT, STALE_DEFAULT } from "@/shared/lib/query-stale";

vi.mock("@/domains/entities/edges/edges.functions", () => ({
  listEdgesFn: vi.fn(),
  listEdgesForCaseFn: vi.fn(),
}));

import {
  edgesForCaseQuery,
  edgesKeys,
  edgesListQuery,
} from "@/domains/entities/edges/queries";

describe("edges queries", () => {
  it("builds entity and case-wide keys", () => {
    expect(edgesKeys.prefix("case-1")).toEqual(["edges", "case-1"]);
    expect(edgesKeys.all("case-1", "ent-1")).toEqual([
      "edges",
      "case-1",
      "ent-1",
    ]);
    expect(edgesKeys.forCase("case-1")).toEqual(["edges", "case-1", "case"]);
  });

  it("uses default stale and gc tiers for list queries", () => {
    expect(edgesListQuery("case-1", "ent-1")).toMatchObject({
      queryKey: edgesKeys.all("case-1", "ent-1"),
      staleTime: STALE_DEFAULT,
      gcTime: GC_DEFAULT,
    });
    expect(edgesForCaseQuery("case-1")).toMatchObject({
      queryKey: edgesKeys.forCase("case-1"),
      staleTime: STALE_DEFAULT,
      gcTime: GC_DEFAULT,
    });
  });
});
