import { describe, expect, it } from "vitest";

import { nextAutoSlug, slugifyName } from "../utils.ts";

describe("slugifyName", () => {
  it("slugifies a display name", () => {
    expect(slugifyName("Ada Lovelace")).toBe("ada-lovelace");
  });
});

describe("nextAutoSlug", () => {
  it("stays in lockstep until the user edits the slug", () => {
    expect(nextAutoSlug("Ada", "ada", "Ada Lovelace")).toBe("ada-lovelace");
    expect(nextAutoSlug("Ada", "custom", "Ada Lovelace")).toBeNull();
  });
});
