import { describe, expect, it, vi } from "vitest";

import { GC_DEFAULT, STALE_DEFAULT } from "@/shared/lib/query-stale";

vi.mock("@/domains/activity/activity.functions", () => ({
  listRecentActivityFn: vi.fn(),
}));

import { activityKeys, recentActivityQuery } from "@/domains/activity/queries";

describe("activity queries", () => {
  it("builds recent activity keys", () => {
    expect(activityKeys.all).toEqual(["activity"]);
    expect(activityKeys.recent()).toEqual(["activity", "recent", {}]);
    expect(activityKeys.recent({ caseId: "case-1", limit: 5 })).toEqual([
      "activity",
      "recent",
      { caseId: "case-1", limit: 5 },
    ]);
  });

  it("uses default stale and gc tiers for recent activity", () => {
    expect(recentActivityQuery({ caseId: "case-1" })).toMatchObject({
      queryKey: activityKeys.recent({ caseId: "case-1" }),
      staleTime: STALE_DEFAULT,
      gcTime: GC_DEFAULT,
    });
  });
});
