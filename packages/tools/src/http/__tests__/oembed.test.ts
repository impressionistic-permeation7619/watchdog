import { describe, expect, it } from "vitest";

import { isOembedUrl, matchOembedVendor } from "../oembed.ts";

describe("matchOembedVendor", () => {
  it("matches youtube and rejects an unknown host", () => {
    expect(
      matchOembedVendor("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    ).toBe("youtube");
    expect(isOembedUrl("https://mailhost.test/video")).toBe(false);
  });
});
