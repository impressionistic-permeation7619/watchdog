import { describe, it, expect } from "vitest";

import {
  identifierPlatformMeta,
  normalizeIdentifierPlatform,
  resolveIdentifierPlatform,
} from "../platforms.ts";

describe("platforms", () => {
  // Extension required for node --experimental-strip-types (file excluded from tsc).

  it("resolveIdentifierPlatform maps aliases", () => {
    expect(resolveIdentifierPlatform("X")).toBe("twitter");
    expect(resolveIdentifierPlatform("ig")).toBe("instagram");
    expect(resolveIdentifierPlatform("tg")).toBe("telegram");
    expect(resolveIdentifierPlatform("not-a-platform")).toBe(null);
  });

  it("platform hosts stay on the catalog", () => {
    expect(identifierPlatformMeta("twitter")?.hosts).toEqual([
      "twitter.com",
      "mobile.twitter.com",
    ]);
    expect(identifierPlatformMeta("reddit")?.hosts).toEqual(["old.reddit.com"]);
  });

  it("normalizeIdentifierPlatform keeps customs freeform", () => {
    expect(normalizeIdentifierPlatform("")).toBe("");
    expect(normalizeIdentifierPlatform("X")).toBe("twitter");
    expect(normalizeIdentifierPlatform("Boy Moment")).toBe("boy_moment");
    expect(normalizeIdentifierPlatform("weird!!site")).toBe("weird_site");
  });
});
