import { describe, expect, it } from "vitest";

import {
  IDENTIFIER_PASTE_TARGET_LABELS,
  parsePasteConfidenceToken,
  parsePasteStatusToken,
  parsePasteTypeToken,
} from "@/domains/entities/lib/parse-identifier-paste.types";

describe("parse-identifier-paste.types", () => {
  it("maps paste target labels and token parsers", () => {
    expect(IDENTIFIER_PASTE_TARGET_LABELS.email).toBe("Email");
    expect(parsePasteTypeToken("email")).toBe("email");
    expect(parsePasteStatusToken("former")).toBe("former");
    expect(parsePasteConfidenceToken("possible")).toBe("possible");
  });
});
