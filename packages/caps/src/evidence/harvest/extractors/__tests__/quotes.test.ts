import { describe, expect, it } from "vitest";

import type { HarvestCtx } from "../types";
import { quotesExtractor } from "../quotes";

function makeCtx(text: string, quotedAuthor: string | null): HarvestCtx {
  return {
    sourceText: text,
    cleaned: text,
    quotedAuthor,
    identifiers: [],
    claims: [],
    questions: [],
    seen: new Set(),
    fediSkip: new Set(),
  };
}

describe("quotes extractor", () => {
  it("emits claim and question when quotedAuthor is set", () => {
    const ctx = makeCtx("quoted body", "Condemned");
    quotesExtractor.collect(ctx);

    expect(
      ctx.claims.some((c) =>
        c.text.includes("Quoted text attributed to Condemned")
      )
    ).toBe(true);
    expect(
      ctx.questions.some((q) =>
        q.text.includes("Re-attribute quoted text to Condemned")
      )
    ).toBe(true);
  });

  it("no-ops without quotedAuthor", () => {
    const ctx = makeCtx("plain text", null);
    quotesExtractor.collect(ctx);
    expect(ctx.claims).toHaveLength(0);
    expect(ctx.questions).toHaveLength(0);
  });
});
