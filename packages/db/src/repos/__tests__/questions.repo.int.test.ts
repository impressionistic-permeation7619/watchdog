import { describe, expect, it } from "vitest";

import { testId } from "@watchdog/test-kit";
import { seedCase, seedEntity, withTestTx } from "@watchdog/test-kit/db";

import { questionsRepo } from "../questions.repo.ts";

describe("questionsRepo", () => {
  it("creates then resolves a question", async () => {
    await withTestTx(async (tx) => {
      const cased = await seedCase(tx);
      const entity = await seedEntity(tx, cased.id, { id: testId(20) });
      const created = await questionsRepo.create(tx, {
        entityId: entity.id,
        text: "Where does Ada live?",
        status: "open",
      });
      if (!created) throw new Error("question");
      const resolved = await questionsRepo.resolve(tx, created.id, {
        resolvedNote: "London",
      });
      expect(resolved?.status).toBe("resolved");
    });
  });
});
