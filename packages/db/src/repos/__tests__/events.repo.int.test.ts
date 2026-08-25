import { describe, expect, it } from "vitest";

import { testId } from "@watchdog/test-kit";
import { seedCase, seedEntity, withTestTx } from "@watchdog/test-kit/db";

import { eventsRepo } from "../events.repo.ts";

describe("eventsRepo", () => {
  it("creates, lists, then deletes an event", async () => {
    await withTestTx(async (tx) => {
      const cased = await seedCase(tx);
      const entity = await seedEntity(tx, cased.id, { id: testId(20) });
      const created = await eventsRepo.create(tx, {
        entityId: entity.id,
        when: "1815-12-10",
        what: "Born",
        whereText: "London",
      });
      if (!created) throw new Error("event");
      const listed = await eventsRepo.listForEntity(tx, entity.id);
      expect(listed.some((row) => row.id === created.id)).toBe(true);
      await eventsRepo.delete(tx, created.id);
      const after = await eventsRepo.listForEntity(tx, entity.id);
      expect(after.some((row) => row.id === created.id)).toBe(false);
    });
  });
});
