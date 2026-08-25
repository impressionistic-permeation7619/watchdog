import { describe, it, expect } from "vitest";

import { containsPattern } from "../_ilike.ts";

describe("containsPattern", () => {
  it("wraps cleaned term", () => {
    expect(containsPattern("alice")).toBe("%alice%");
  });

  it("strips wildcard characters", () => {
    expect(containsPattern("a%_b")).toBe("%ab%");
  });

  it("returns null when nothing remains", () => {
    expect(containsPattern("%%%")).toBe(null);
    expect(containsPattern("  ")).toBe(null);
  });
});
