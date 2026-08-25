import { beforeEach, describe, expect, it } from "vitest";

import { listClaimsForEntity, writeGraphFromAgent } from "@watchdog/core";
import { TEST_ACTOR_ID, buildClaimCreateOp, testId } from "@watchdog/test-kit";
import {
  resetTestDb,
  seedCase,
  seedEntity,
  testDb,
} from "@watchdog/test-kit/db";

describe("graph write (core service)", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("writes an unverified claim via the agent escape hatch", async () => {
    const cased = await seedCase(testDb);
    const entity = await seedEntity(testDb, cased.id, { id: testId(20) });
    const written = await writeGraphFromAgent({
      caseId: cased.id,
      actorId: TEST_ACTOR_ID,
      userOverride: true,
      patch: [
        buildClaimCreateOp(entity.id, "Ada observed a host", {
          id: testId(30),
        }),
      ],
    });
    expect(written.confidence).toBe("unverified");
    expect(written.opCount).toBe(1);
    const claims = await listClaimsForEntity(cased.id, entity.id);
    expect(claims.some((row) => row.text === "Ada observed a host")).toBe(true);
  });
});
