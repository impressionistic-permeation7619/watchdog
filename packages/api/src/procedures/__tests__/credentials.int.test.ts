import { beforeEach, describe, expect, it } from "vitest";

import { listCredentialSlots, putCredentialSlot } from "@watchdog/core";
import { TEST_ACTOR_ID } from "@watchdog/test-kit";
import { resetTestDb } from "@watchdog/test-kit/db";

describe("credentials (core services)", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  it("lists a configured slot without returning plaintext", async () => {
    await putCredentialSlot({
      userId: TEST_ACTOR_ID,
      name: "AI_COMPAT_API_KEY",
      secret: "sk-never-list",
    });
    const slots = await listCredentialSlots(TEST_ACTOR_ID);
    const slot = slots.find((row) => row.name === "AI_COMPAT_API_KEY");
    expect(slot?.configured).toBe(true);
    expect(JSON.stringify(slots)).not.toMatch(/sk-never-list/);
  });
});
