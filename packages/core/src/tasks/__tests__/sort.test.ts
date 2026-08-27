import { describe, expect, it } from "vitest";

import type { TaskRow } from "@watchdog/db";

import { compareTaskRows, taskPriorityRank } from "../sort";

function task(partial: Partial<TaskRow> & Pick<TaskRow, "id">): TaskRow {
  return {
    caseId: "case-1",
    title: "Task",
    status: "open",
    priority: null,
    dueDate: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...partial,
  } as TaskRow;
}

describe("task sort", () => {
  it("taskPriorityRank orders urgent above low", () => {
    expect(taskPriorityRank("urgent")).toBeGreaterThan(taskPriorityRank("low"));
    expect(taskPriorityRank(null)).toBe(0);
  });

  it("compareTaskRows sorts by priority then due date", () => {
    const urgent = task({
      id: "a",
      priority: "urgent",
      dueDate: new Date("2026-02-01"),
    });
    const low = task({
      id: "b",
      priority: "low",
      dueDate: new Date("2026-01-01"),
    });
    expect(compareTaskRows(urgent, low)).toBeLessThan(0);
  });
});
