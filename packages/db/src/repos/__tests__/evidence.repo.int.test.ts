import { describe, it, expect } from "vitest";

import { seedCase, seedEvidence, withTestTx } from "@watchdog/test-kit/db";

import { evidenceRepo } from "../evidence.repo.ts";

describe("evidenceRepo", () => {
  it("hides soft-deleted rows from the default list and shows them via deletedOnly", async () => {
    await withTestTx(async (tx) => {
      const cased = await seedCase(tx);
      const created = await seedEvidence(tx, cased.id);

      const before = await evidenceRepo.listForCase(tx, cased.id);
      expect(before.some((row) => row.id === created.id)).toBe(true);

      const deleted = await evidenceRepo.softDelete(tx, cased.id, created.id);
      expect(deleted?.id).toBe(created.id);

      const after = await evidenceRepo.listForCase(tx, cased.id);
      expect(after.some((row) => row.id === created.id)).toBe(false);

      const hidden = await evidenceRepo.listForCase(tx, cased.id, {
        deletedOnly: true,
      });
      expect(hidden.some((row) => row.id === created.id)).toBe(true);
    });
  });
});
