import { describe, expect, it } from "vitest";

import {
  cleanPasteCell,
  inferPasteIdentity,
} from "@/domains/entities/lib/infer-paste-identity";

describe("infer-paste-identity", () => {
  it("strips wrapping quotes from pasted cells", () => {
    expect(cleanPasteCell('"alpha@example.com"')).toBe("alpha@example.com");
  });

  it("infers email and handle identities", () => {
    expect(inferPasteIdentity("alpha@example.com")).toEqual({
      type: "email",
      value: "alpha@example.com",
      platform: null,
    });
    expect(inferPasteIdentity("@analyst")).toEqual({
      type: "handle",
      value: "analyst",
      platform: null,
    });
  });
});
