import { describe, expect, it } from "vitest";

import { matchPasteEntity } from "@/domains/entities/lib/match-paste-entity";

describe("match-paste-entity", () => {
  it("matches entities by slug and reports ambiguity", () => {
    const entities = [
      { id: "e1", name: "Alice", slug: "alice" },
      { id: "e2", name: "Bob", slug: "bob" },
      { id: "e3", name: "Carol", slug: "alice-dup" },
    ];

    expect(matchPasteEntity("alice-dup", entities, "")).toEqual({
      id: "e3",
      name: "Carol",
    });
    expect(matchPasteEntity("Alice", entities, "")).toEqual({
      id: "e1",
      name: "Alice",
    });

    const ambiguous = [
      { id: "e1", name: "Alice", slug: "alice" },
      { id: "e3", name: "Alice", slug: "alice-dup" },
    ];
    expect(matchPasteEntity("Alice", ambiguous, "")).toEqual({
      error: "Entity is ambiguous",
    });
  });
});
