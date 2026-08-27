import { describe, expect, it } from "vitest";

import { modernMessengersExtractor } from "../modern-messengers";
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

describe("modern messengers extractor", () => {
  it("collects telegram and bluesky handles", () => {
    const ctx = makeCtx(
      "Reach t.me/alphatest12345 or alice.bsky.social for updates"
    );
    modernMessengersExtractor.collect(ctx);

    expect(
      ctx.identifiers.some(
        (i) =>
          i.type === "handle" &&
          i.platform === "telegram" &&
          i.value === "@alphatest12345"
      )
    ).toBe(true);
    expect(
      ctx.identifiers.some(
        (i) =>
          i.type === "handle" &&
          i.platform === "bluesky" &&
          i.value === "alice.bsky.social"
      )
    ).toBe(true);
  });
});
