import { describe, expect, it } from "vitest";

import { seedCase, withTestTx } from "@watchdog/test-kit/db";

import { tasksRepo } from "../tasks.repo.ts";

describe("tasksRepo", () => {
  it("filters unattached tasks for a case", async () => {
    await withTestTx(async (tx) => {
      const cased = await seedCase(tx);
      const created = await tasksRepo.create(tx, {
        caseId: cased.id,
        title: "Unattached follow-up",
        status: "backlog",
      });
      if (!created) throw new Error("task");
      const listed = await tasksRepo.listForCase(tx, cased.id, {
        unattachedOnly: true,
      });
      expect(listed.some((row) => row.id === created.id)).toBe(true);
    });
  });

  it("lists a column by position then createdAt", async () => {
    await withTestTx(async (tx) => {
      const cased = await seedCase(tx);
      const a = await tasksRepo.create(tx, {
        caseId: cased.id,
        title: "A",
        status: "backlog",
      });
      const b = await tasksRepo.create(tx, {
        caseId: cased.id,
        title: "B",
        status: "backlog",
      });
      if (!a || !b) throw new Error("task");
      await tasksRepo.rewriteOrder(tx, cased.id, "backlog", [b.id, a.id]);
      const listed = await tasksRepo.listForCase(tx, cased.id, {
        status: "backlog",
      });
      expect(listed.map((row) => row.id)).toEqual([b.id, a.id]);
    });
  });
});
