import { beforeEach, describe, expect, it } from "vitest";

import { createTask, listRecentActivity, updateTask } from "@watchdog/core";
import { db } from "@watchdog/db";
import { resetTestDb, seedCase } from "@watchdog/test-kit/db";

describe("listRecentActivity", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("merges a task status change from the database", async () => {
    const cased = await seedCase(db);
    const task = await createTask({
      caseId: cased.id,
      title: "Follow up WHOIS",
    });
    await updateTask({
      caseId: cased.id,
      taskId: task.id,
      status: "in_progress",
    });
    const items = await listRecentActivity({ caseId: cased.id, limit: 20 });
    expect(items.some((row) => row.kind === "task")).toBe(true);
  });
});
