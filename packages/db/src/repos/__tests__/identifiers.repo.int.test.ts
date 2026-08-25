import { describe, it, expect } from "vitest";

import { testId } from "@watchdog/test-kit";
import {
  seedCase,
  seedEntity,
  seedIdentifier,
  withTestTx,
} from "@watchdog/test-kit/db";

import { identifiersRepo } from "../identifiers.repo.ts";

describe("identifiersRepo", () => {
  it("includes entityName on listForCase and returns the row from listForEntity", async () => {
    await withTestTx(async (tx) => {
      const cased = await seedCase(tx);
      const entity = await seedEntity(tx, cased.id, {
        id: testId(21),
        name: "Ada Lovelace",
        slug: "ada-lovelace",
      });
      const created = await seedIdentifier(tx, entity.id, {
        type: "email",
        value: "ada@example.com",
        platform: "",
      });

      const forEntity = await identifiersRepo.listForEntity(tx, entity.id);
      expect(forEntity.some((row) => row.id === created.id)).toBe(true);

      const forCase = await identifiersRepo.listForCase(tx, cased.id);
      const listed = forCase.find((row) => row.id === created.id);
      expect(listed?.entityName).toBe("Ada Lovelace");
      expect(listed?.value).toBe("ada@example.com");
    });
  });
});
