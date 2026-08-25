import { describe, expect, it } from "vitest";

import { testId } from "@watchdog/test-kit";
import {
  seedCase,
  seedEntity,
  seedEvidence,
  withTestTx,
} from "@watchdog/test-kit/db";

import { claimsRepo } from "../claims.repo.ts";
import { evidenceLinksRepo } from "../evidence-links.repo.ts";

describe("evidenceLinksRepo", () => {
  it("replaceClaim drops old ids and keeps the new set", async () => {
    await withTestTx(async (tx) => {
      const cased = await seedCase(tx);
      const entity = await seedEntity(tx, cased.id, { id: testId(20) });
      const first = await seedEvidence(tx, cased.id, { label: "a" });
      const second = await seedEvidence(tx, cased.id, { label: "b" });
      const claim = await claimsRepo.create(tx, {
        entityId: entity.id,
        text: "cited",
        class: "observation",
        confidence: "unverified",
      });
      if (!claim) throw new Error("claim");

      await evidenceLinksRepo.linkClaim(tx, claim.id, [first.id]);
      const replaced = await evidenceLinksRepo.replaceClaim(tx, claim.id, [
        second.id,
      ]);
      expect(replaced).toEqual([second.id]);

      const listed = await evidenceLinksRepo.listForClaims(tx, [claim.id]);
      expect(listed.get(claim.id)).toEqual([second.id]);
    });
  });
});
