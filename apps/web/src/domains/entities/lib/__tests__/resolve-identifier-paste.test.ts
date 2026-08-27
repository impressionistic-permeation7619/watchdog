import { describe, expect, it } from "vitest";

import {
  identifierPasteRowKey,
  isIdentifierPasteRowImportable,
} from "@/domains/entities/lib/resolve-identifier-paste";

describe("resolve-identifier-paste", () => {
  it("builds stable row keys and importability checks", () => {
    expect(identifierPasteRowKey({ sourceIndex: 2, columnIndex: 1 })).toBe(
      "2\u00001"
    );

    expect(
      isIdentifierPasteRowImportable({
        sourceIndex: 0,
        columnIndex: 0,
        sourceLine: "line",
        entityId: "e1",
        entityName: "Alice",
        entityError: null,
        type: "email",
        value: "a@example.com",
        platform: "",
        status: "current",
        confidence: "unverified",
        error: null,
        note: null,
      })
    ).toBe(true);
  });
});
