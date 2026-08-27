import { describe, expect, it } from "vitest";

import { fediverseExtractor, matrixExtractor } from "../fediverse-matrix";
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

describe("fediverse-matrix extractors", () => {
  it("collects fediverse and matrix handles", () => {
    const fediverse = makeCtx("@alice@social.example");
    fediverseExtractor.collect(fediverse);
    expect(
      fediverse.identifiers.some(
        (i) => i.platform === "mastodon" && i.value.includes("alice")
      )
    ).toBe(true);

    const matrix = makeCtx("Matrix: @alice:matrix.org");
    matrixExtractor.collect(matrix);
    expect(
      matrix.identifiers.some(
        (i) => i.platform === "matrix" && i.value === "@alice:matrix.org"
      )
    ).toBe(true);
  });
});
