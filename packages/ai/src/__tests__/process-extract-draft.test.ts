import { describe, expect, it } from "vitest";

import {
  isEmptyDraft,
  processExtractDraftSchema,
} from "../process-extract-draft";

describe("processExtractDraftSchema", () => {
  it("fills empty arrays when parsing an empty object", () => {
    const parsed = processExtractDraftSchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data.identifiers).toEqual([]);
    expect(parsed.data.claims).toEqual([]);
    expect(parsed.data.questions).toEqual([]);
  });

  it("rejects an identifier with an empty value", () => {
    const parsed = processExtractDraftSchema.safeParse({
      identifiers: [{ type: "email", value: "" }],
    });
    expect(parsed.success).toBe(false);
  });

  it("strips extra confidence fields", () => {
    const parsed = processExtractDraftSchema.safeParse({
      identifiers: [
        {
          type: "email",
          value: "ada@example.com",
          confidence: "confirmed",
        },
      ],
      claims: [{ text: "observed", confidence: "confirmed" }],
      confidence: "confirmed",
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;
    expect(parsed.data).not.toHaveProperty("confidence");
    expect(parsed.data.identifiers[0]).not.toHaveProperty("confidence");
    expect(parsed.data.claims[0]).not.toHaveProperty("confidence");
  });
});

describe("isEmptyDraft", () => {
  it("returns true when every collection is empty", () => {
    expect(isEmptyDraft({ identifiers: [], claims: [], questions: [] })).toBe(
      true
    );
  });

  it("returns false when an identifier is present", () => {
    expect(
      isEmptyDraft({
        identifiers: [{ type: "email", value: "ada@example.com" }],
        claims: [],
        questions: [],
      })
    ).toBe(false);
  });
});
