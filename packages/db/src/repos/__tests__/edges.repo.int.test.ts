import { describe, expect, it } from "vitest";

import { testId } from "@watchdog/test-kit";
import { seedCase, seedEntity, withTestTx } from "@watchdog/test-kit/db";

import { edgesRepo } from "../edges.repo.ts";

describe("edgesRepo", () => {
  it("lists endpoint names for a case-scoped edge", async () => {
    await withTestTx(async (tx) => {
      const cased = await seedCase(tx);
      const from = await seedEntity(tx, cased.id, {
        id: testId(20),
        name: "From",
        slug: "from",
      });
      const to = await seedEntity(tx, cased.id, {
        id: testId(21),
        name: "To",
        slug: "to",
      });
      const created = await edgesRepo.create(tx, {
        fromId: from.id,
        toId: to.id,
        predicate: "owns",
        confidence: "unverified",
        notes: null,
      });
      if (!created) throw new Error("edge");
      const listed = await edgesRepo.listForCase(tx, cased.id);
      const row = listed.find((item) => item.id === created.id);
      expect(row?.fromName).toBe("From");
      expect(row?.toName).toBe("To");
    });
  });
});
