import { describe, expect, it } from "vitest";

import {
  createCaseInputSchema,
  deleteCaseInputSchema,
  setActiveCaseIdInputSchema,
} from "@/domains/cases/types";

const CASE_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("case input schemas", () => {
  it("slugifies create input when slug is omitted", () => {
    const parsed = createCaseInputSchema.parse({
      name: "Alpha Case",
    });
    expect(parsed.slug).toBe("alpha-case");
  });

  it("normalizes empty active case ids to null", () => {
    expect(setActiveCaseIdInputSchema.parse({ caseId: "" }).caseId).toBeNull();
    expect(setActiveCaseIdInputSchema.parse({ caseId: null }).caseId).toBeNull();
    expect(setActiveCaseIdInputSchema.parse({ caseId: CASE_ID }).caseId).toBe(
      CASE_ID
    );
  });

  it("parses delete case input", () => {
    expect(deleteCaseInputSchema.parse({ id: CASE_ID }).id).toBe(CASE_ID);
  });
});
