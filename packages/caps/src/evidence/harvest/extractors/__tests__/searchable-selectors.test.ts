import { describe, expect, it } from "vitest";

import { searchableSelectorsExtractor } from "../searchable-selectors";
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

describe("searchable selectors extractor", () => {
  it("collects payment handles, ham callsigns, and licence phrasing", () => {
    const ctx = makeCtx(
      "my paypal is @donor123 — call sign K1ABC — licensed registered nurse"
    );
    searchableSelectorsExtractor.collect(ctx);

    expect(
      ctx.identifiers.some(
        (i) =>
          i.type === "handle" &&
          i.platform === "paypal" &&
          i.value === "@donor123"
      )
    ).toBe(true);
    expect(
      ctx.identifiers.some(
        (i) => i.notes === "ham_callsign" && i.value === "K1ABC"
      )
    ).toBe(true);
    expect(
      ctx.claims.some((c) =>
        c.text.toLowerCase().includes("professional licence")
      )
    ).toBe(true);
  });
});
