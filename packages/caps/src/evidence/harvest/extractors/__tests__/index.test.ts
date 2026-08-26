import { describe, expect, it } from "vitest";

import { HARVEST_EXTRACTORS } from "../index";

describe("HARVEST_EXTRACTORS index", () => {
  it("registers all extractor modules with unique ids", () => {
    expect(HARVEST_EXTRACTORS.length).toBeGreaterThan(10);
    const ids = HARVEST_EXTRACTORS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("claims");
    expect(ids).toContain("quotes");
  });
});
