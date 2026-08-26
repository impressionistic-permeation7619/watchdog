import { describe, expect, it } from "vitest";

import type { HarvestCtx } from "../types";
import { phonesExtractor } from "../phones";

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

describe("phones extractor", () => {
  it("collects domestic and international phone numbers", () => {
    const domestic = makeCtx("Call (555) 123-4567");
    phonesExtractor.collect(domestic);
    expect(
      domestic.identifiers.some(
        (i) => i.type === "phone" && i.value.includes("555")
      )
    ).toBe(true);

    const intl = makeCtx("intl +1 555 987 6543");
    phonesExtractor.collect(intl);
    expect(
      intl.identifiers.some((i) => i.type === "phone" && i.value.includes("987"))
    ).toBe(true);
  });
});
