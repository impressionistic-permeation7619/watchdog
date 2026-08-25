import { describe, it, expect } from "vitest";

import { TEST_ACTOR_ID, buildClaimCreateOp, testId } from "@watchdog/test-kit";
import {
  seedCase,
  seedEntity,
  seedProposal,
  withTestTx,
} from "@watchdog/test-kit/db";

import { proposalsRepo } from "../proposals.repo.ts";

describe("proposalsRepo", () => {
  it("accepts only a pending proposal and returns null on a second accept", async () => {
    await withTestTx(async (tx) => {
      const cased = await seedCase(tx);
      const entity = await seedEntity(tx, cased.id, { id: testId(20) });
      const { id } = await seedProposal(tx, cased.id, [
        buildClaimCreateOp(entity.id, "Ada observed", { id: testId(30) }),
      ]);

      const first = await proposalsRepo.accept(tx, id, {
        decidedBy: TEST_ACTOR_ID,
        decidedAt: new Date(),
      });
      expect(first?.status).toBe("accepted");

      const second = await proposalsRepo.accept(tx, id, {
        decidedBy: TEST_ACTOR_ID,
        decidedAt: new Date(),
      });
      expect(second).toBe(null);
    });
  });
});
