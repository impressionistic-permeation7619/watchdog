import { describe, it, expect } from "vitest";

import { fc } from "@watchdog/test-kit/fc";

import { containsPattern } from "../_ilike.ts";

describe("containsPattern", () => {
  it("never leaves raw SQL wildcards inside the wrapped term", () => {
    fc.assert(
      fc.property(fc.string(), (term) => {
        const out = containsPattern(term);
        if (out === null) {
          expect(term.replaceAll(/[%_]/g, "").trim()).toBe("");
          return;
        }
        expect(out.startsWith("%")).toBe(true);
        expect(out.endsWith("%")).toBe(true);
        const inner = new Set(out.slice(1, -1));
        expect(inner.has("%")).toBe(false);
        expect(inner.has("_")).toBe(false);
      })
    );
  });
});
