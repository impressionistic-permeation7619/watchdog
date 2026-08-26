import { describe, expect, it } from "vitest";

import type { HarvestCtx } from "../types";
import { cryptoExtractor } from "../crypto";

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

describe("crypto extractor", () => {
  it("extracts valid bitcoin addresses", () => {
    const ctx = makeCtx("Donate: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
    cryptoExtractor.collect(ctx);

    expect(
      ctx.identifiers.some(
        (i) =>
          i.type === "crypto" &&
          i.platform === "bitcoin" &&
          i.value === "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
      )
    ).toBe(true);
  });
});
