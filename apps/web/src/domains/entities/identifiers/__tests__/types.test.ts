import { describe, expect, it } from "vitest";
import { testId } from "@watchdog/test-kit";

import { createIdentifierInputSchema } from "@/domains/entities/identifiers/types";

describe("identifiers types schemas", () => {
  it("defaults status to unknown and trims optional fields", () => {
    const parsed = createIdentifierInputSchema.parse({
      caseId: testId(10),
      entityId: testId(20),
      type: "email",
      value: " user@example.com ",
      confidence: "possible",
      platform: "  ",
      notes: " work ",
    });

    expect(parsed.status).toBe("unknown");
    expect(parsed.value).toBe("user@example.com");
    expect(parsed.notes).toBe("work");
    expect(parsed.platform).toBeUndefined();
  });
});
