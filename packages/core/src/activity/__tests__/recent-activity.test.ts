import { describe, it, expect } from "vitest";

import {
  jobActivityAction,
  mergeActivityItems,
  taskEventAction,
  type ActivityItem,
} from "../recent-activity";

function item(
  id: string,
  at: string,
  kind: ActivityItem["kind"] = "evidence"
): ActivityItem {
  return {
    id,
    kind,
    action: "Captured",
    caseId: "case-1",
    caseName: "Case",
    label: id,
    at,
  };
}

describe("mergeActivityItems", () => {
  it("sorts newest first and respects limit", () => {
    const merged = mergeActivityItems(
      [
        item("a", "2026-01-01T00:00:00.000Z"),
        item("c", "2026-01-03T00:00:00.000Z"),
        item("b", "2026-01-02T00:00:00.000Z"),
      ],
      2
    );
    expect(merged.map((row) => row.id)).toEqual(["c", "b"]);
  });

  it("returns empty for empty input", () => {
    expect(mergeActivityItems([], 15)).toEqual([]);
  });
});

describe("taskEventAction", () => {
  it("maps create / delete", () => {
    expect(taskEventAction("created", "backlog")).toBe("Created");
    expect(taskEventAction("deleted", null)).toBe("Deleted");
  });

  it("maps status transitions", () => {
    expect(taskEventAction("status_changed", "done")).toBe("Completed");
    expect(taskEventAction("status_changed", "dropped")).toBe("Dropped");
    expect(taskEventAction("status_changed", "blocked")).toBe("Moved");
  });

  it("falls back to Updated", () => {
    expect(taskEventAction("updated", null)).toBe("Updated");
  });
});

describe("jobActivityAction", () => {
  it("maps terminal and live statuses", () => {
    expect(jobActivityAction("succeeded")).toBe("Succeeded");
    expect(jobActivityAction("failed")).toBe("Failed");
    expect(jobActivityAction("running")).toBe("Running");
    expect(jobActivityAction("queued")).toBe("Queued");
  });
});
