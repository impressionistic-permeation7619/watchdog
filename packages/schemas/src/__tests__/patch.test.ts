import { describe, expect, it } from "vitest";

import { testId } from "@watchdog/test-kit";

import { patchOpSchema } from "../patch.ts";

describe("patchOpSchema", () => {
  it("rejects confidence smuggled onto a claim op", () => {
    const parsed = patchOpSchema.safeParse({
      op: "create",
      resource: "claim",
      id: testId(30),
      data: {
        entityId: testId(20),
        text: "Ada observed a host",
        class: "observation",
        confidence: "confirmed",
      },
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts an event op without confidence", () => {
    const parsed = patchOpSchema.safeParse({
      op: "create",
      resource: "event",
      id: testId(31),
      data: {
        entityId: testId(20),
        when: "1815-12-10",
        what: "Born",
      },
    });
    expect(parsed.success).toBe(true);
  });
});
