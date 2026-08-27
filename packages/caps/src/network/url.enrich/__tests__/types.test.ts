import { describe, expect, it } from "vitest";

import {
  ACCEPT_MARKDOWN_FIRST,
  URL_ENRICH_MAX_BYTES,
  URL_ENRICH_UA,
} from "../types";

describe("url.enrich types", () => {
  it("exports enrich constants", () => {
    expect(URL_ENRICH_UA).toContain("network.url.enrich");
    expect(URL_ENRICH_MAX_BYTES).toBeGreaterThan(0);
    expect(ACCEPT_MARKDOWN_FIRST).toContain("text/markdown");
  });
});
