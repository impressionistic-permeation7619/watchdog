import { describe, expect, it } from "vitest";

import { handlesExtractor } from "../handles";
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

describe("handles extractor", () => {
  it("extracts platform-qualified handles", () => {
    const ctx = makeCtx("Follow @alice_osint (Twitter)");
    handlesExtractor.collect(ctx);

    expect(
      ctx.identifiers.some(
        (i) =>
          i.type === "handle" &&
          i.value === "@alice_osint" &&
          i.platform === "twitter"
      )
    ).toBe(true);
  });
});
