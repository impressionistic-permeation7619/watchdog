import { describe, expect, it, vi } from "vitest";

import { GC_DEFAULT, STALE_DEFAULT } from "@/shared/lib/query-stale";

vi.mock("@/domains/tasks/tasks.functions", () => ({
  listTasksFn: vi.fn(),
}));

import { tasksKeys, tasksListQuery } from "@/domains/tasks/queries";

describe("tasks queries", () => {
  it("builds case-scoped task keys", () => {
    expect(tasksKeys.all("case-1")).toEqual(["tasks", "case-1"]);
    expect(tasksKeys.list("case-1", { status: "in_progress" })).toEqual([
      "tasks",
      "case-1",
      { status: "in_progress" },
    ]);
  });

  it("uses default stale and gc tiers for task lists", () => {
    expect(tasksListQuery("case-1")).toMatchObject({
      queryKey: tasksKeys.list("case-1"),
      staleTime: STALE_DEFAULT,
      gcTime: GC_DEFAULT,
    });
  });
});
