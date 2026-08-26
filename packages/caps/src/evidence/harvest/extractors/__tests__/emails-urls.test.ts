import { describe, expect, it } from "vitest";

import type { HarvestCtx } from "../types";
import { emailsExtractor, urlsExtractor } from "../emails-urls";

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

describe("emails-urls extractors", () => {
  it("collects emails and plain URLs", () => {
    const ctx = makeCtx(
      "Contact alice@mailhost.test — see https://wiki.example.org/x"
    );
    emailsExtractor.collect(ctx);
    urlsExtractor.collect(ctx);

    expect(
      ctx.identifiers.some(
        (i) => i.type === "email" && i.value === "alice@mailhost.test"
      )
    ).toBe(true);
    expect(
      ctx.identifiers.some(
        (i) => i.type === "url" && i.value.includes("wiki.example.org")
      )
    ).toBe(true);
  });
});
