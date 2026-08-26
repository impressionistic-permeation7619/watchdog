import { describe, expect, it } from "vitest";

import type { HarvestCtx } from "../types";
import { darknetExtractor } from "../darknet-pastes-p2p";

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

describe("darknet extractor", () => {
  it("extracts onion service URLs", () => {
    const ctx = makeCtx("Hidden service: abcdefghijklmnop.onion");
    darknetExtractor.collect(ctx);

    expect(
      ctx.identifiers.some(
        (i) => i.type === "url" && i.notes === "onion"
      )
    ).toBe(true);
  });
});
