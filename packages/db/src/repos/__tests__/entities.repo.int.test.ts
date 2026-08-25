import { describe, expect, it } from "vitest";

import { testId } from "@watchdog/test-kit";
import { seedCase, seedEntity, withTestTx } from "@watchdog/test-kit/db";

import { entitiesRepo } from "../entities.repo.ts";

describe("entitiesRepo", () => {
  it("searchForCase matches a name substring", async () => {
    await withTestTx(async (tx) => {
      const cased = await seedCase(tx);
      await seedEntity(tx, cased.id, {
        id: testId(20),
        name: "Ada Lovelace",
        slug: "ada-lovelace",
      });
      const hits = await entitiesRepo.searchForCase(tx, cased.id, "Ada", 10);
      expect(hits.some((row) => row.name === "Ada Lovelace")).toBe(true);
    });
  });
});
