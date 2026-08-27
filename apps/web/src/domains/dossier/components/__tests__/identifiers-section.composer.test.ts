import { describe, expect, it } from "vitest";

import {
  IDENTIFIER_CREATE_DEFAULTS,
  identifierCreateCanSubmit,
} from "@/domains/dossier/components/identifiers-section.composer";

describe("identifiers-section.composer re-export", () => {
  it("requires a valid value before submit", () => {
    expect(identifierCreateCanSubmit(IDENTIFIER_CREATE_DEFAULTS)).toBe(false);
    expect(
      identifierCreateCanSubmit({
        ...IDENTIFIER_CREATE_DEFAULTS,
        value: "user@example.com",
      })
    ).toBe(true);
  });

  it("blocks confirmed confidence without evidence", () => {
    expect(
      identifierCreateCanSubmit({
        ...IDENTIFIER_CREATE_DEFAULTS,
        type: "email",
        value: "user@example.com",
        confidence: "confirmed",
        evidenceIds: [],
      })
    ).toBe(false);
  });
});
