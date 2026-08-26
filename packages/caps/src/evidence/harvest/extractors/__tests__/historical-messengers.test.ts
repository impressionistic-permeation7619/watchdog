import { describe, expect, it } from "vitest";

import type { HarvestCtx } from "../types";
import { historicalMessengersExtractor } from "../historical-messengers";

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

describe("historical messengers extractor", () => {
  it("extracts legacy messenger handles", () => {
    const ctx = makeCtx("ICQ: 123456789");
    historicalMessengersExtractor.collect(ctx);

    expect(
      ctx.identifiers.some(
        (i) => i.type === "handle" && i.platform === "icq"
      )
    ).toBe(true);
  });
});
