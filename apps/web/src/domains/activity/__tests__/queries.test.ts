import { describe, expect, it, vi } from "vitest";

vi.mock("@/domains/activity/activity.functions", () => ({
  listRecentActivityFn: vi.fn(async () => []),
}));

import { activityKeys, recentActivityQuery } from "@/domains/activity/queries";

describe("activity queries", () => {
  it("builds stable recent activity query keys", () => {
    expect(activityKeys.recent({ caseId: "case-1", limit: 10 })).toEqual([
      "activity",
      "recent",
      { caseId: "case-1", limit: 10 },
    ]);
  });

  it("wires listRecentActivityFn into query options", () => {
    expect(recentActivityQuery({ caseId: "case-1" }).queryKey).toEqual([
      "activity",
      "recent",
      { caseId: "case-1" },
    ]);
  });
});
