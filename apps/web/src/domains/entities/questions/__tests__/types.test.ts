import { describe, expect, it } from "vitest";

import {
  createQuestionInputSchema,
  resolveQuestionInputSchema,
} from "@/domains/entities/questions/types";
import { testId } from "@watchdog/test-kit";

describe("questions types schemas", () => {
  it("parses create and resolve question payloads", () => {
    expect(
      createQuestionInputSchema.parse({
        caseId: testId(10),
        entityId: testId(20),
        text: " Who owns the domain? ",
      }).text
    ).toBe("Who owns the domain?");

    expect(
      resolveQuestionInputSchema.parse({
        caseId: testId(10),
        questionId: testId(1),
        resolvedNote: " Found in WHOIS ",
      }).resolvedNote
    ).toBe("Found in WHOIS");
  });
});
