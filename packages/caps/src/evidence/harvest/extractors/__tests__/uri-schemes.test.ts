import { describe, expect, it } from "vitest";

import type { HarvestCtx } from "../types";
import { uriSchemesExtractor } from "../uri-schemes";

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

describe("uri schemes extractor", () => {
  it("collects mailto emails and tel numbers", () => {
    const ctx = makeCtx(
      "mailto:alice@mailhost.test and tel:+15551234567"
    );
    uriSchemesExtractor.collect(ctx);

    expect(
      ctx.identifiers.some(
        (i) => i.type === "email" && i.value === "alice@mailhost.test"
      )
    ).toBe(true);
    expect(
      ctx.identifiers.some(
        (i) => i.type === "phone" && i.value.includes("555")
      )
    ).toBe(true);
  });
});
