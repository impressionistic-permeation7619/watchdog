import { describe, expect, it } from "vitest";

import { urlscanSubmitInput } from "../input";

describe("urlscan.submit input", () => {
  it("requires url and defaults visibility to optional enum", () => {
    expect(
      urlscanSubmitInput.parse({
        url: "https://example.com/page",
        visibility: "unlisted",
      })
    ).toMatchObject({ url: "https://example.com/page", visibility: "unlisted" });
  });
});
