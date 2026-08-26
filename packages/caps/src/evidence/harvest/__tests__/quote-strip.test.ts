import { describe, expect, it } from "vitest";

import { maskQuotedSpans } from "../quote-strip";

describe("maskQuotedSpans", () => {
  it("masks IPB quote body and returns quoted author", () => {
    const text =
      "My note. On 1/6/2026 at 4:11 PM, Condemned said: leak@other.test hidden";
    const { cleaned, quotedAuthor } = maskQuotedSpans(text);

    expect(quotedAuthor).toBe("Condemned");
    expect(cleaned).toContain("My note.");
    expect(cleaned).not.toContain("leak@other.test");
  });

  it("returns original text when no quote headers", () => {
    const text = "plain post body";
    const { cleaned, quotedAuthor } = maskQuotedSpans(text);
    expect(cleaned).toBe(text);
    expect(quotedAuthor).toBeNull();
  });
});
