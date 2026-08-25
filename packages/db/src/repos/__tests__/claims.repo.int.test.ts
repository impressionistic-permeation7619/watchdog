import { describe, expect, it } from "vitest";

import { testId } from "@watchdog/test-kit";
import { seedCase, seedEntity, withTestTx } from "@watchdog/test-kit/db";

import { claimsRepo } from "../claims.repo.ts";

describe("claimsRepo", () => {
  it("retracts a claim and hides it from the default list", async () => {
    await withTestTx(async (tx) => {
      const cased = await seedCase(tx);
      const entity = await seedEntity(tx, cased.id, { id: testId(20) });
      const created = await claimsRepo.create(tx, {
        entityId: entity.id,
        text: "Ada observed a host",
        class: "observation",
        confidence: "unverified",
      });
      if (!created) throw new Error("claim");
      await claimsRepo.retract(tx, created.id, {
        retractKind: "retracted",
        retractedReason: "nope",
        retractedBy: "test-actor",
      });
      const listed = await claimsRepo.listForEntity(tx, entity.id);
      expect(listed.some((row) => row.id === created.id)).toBe(false);
      const all = await claimsRepo.listForEntity(tx, entity.id, {
        includeRetracted: true,
      });
      expect(all.some((row) => row.id === created.id && row.retracted)).toBe(
        true
      );
    });
  });
});
