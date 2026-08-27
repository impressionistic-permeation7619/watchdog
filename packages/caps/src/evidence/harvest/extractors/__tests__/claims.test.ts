import { describe, expect, it } from "vitest";

import { claimsExtractor } from "../claims";
import type { HarvestCtx } from "../types";

function makeCtx(text: string): HarvestCtx {
  return {
    sourceText: text,
    cleaned: text,
    quotedAuthor: null,
    identifiers: [],
    claims: [],
    questions: [],
    seen: new Set(),
    fediSkip: new Set(),
  };
}

describe("claims extractor", () => {
  it("captures numbered claims and name disclosures", () => {
    const ctx = makeCtx("1. **Uses alias Alpha**\nmy real name is Jane Doe");
    claimsExtractor.collect(ctx);

    expect(ctx.claims.some((c) => c.text.includes("Uses alias Alpha"))).toBe(
      true
    );
    expect(
      ctx.identifiers.some((i) => i.type === "other" && i.value === "Jane Doe")
    ).toBe(true);
  });
});
