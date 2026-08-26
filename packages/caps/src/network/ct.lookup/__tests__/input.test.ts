import { describe, expect, it } from "vitest";

import { ctLookupInput } from "../input";

describe("ct.lookup input", () => {
  it("requires host and accepts optional limit and entityId", () => {
    expect(
      ctLookupInput.parse({
        host: "example.com",
        limit: 25,
      })
    ).toMatchObject({ host: "example.com", limit: 25 });
  });
});
