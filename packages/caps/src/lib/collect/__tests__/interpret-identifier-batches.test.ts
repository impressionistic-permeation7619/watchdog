import { describe, it, expect } from "vitest";

import { interpretIdentifierBatches } from "../interpret-identifier-batches.ts";

describe("interpret-identifier-batches", () => {
  const entityId = "11111111-1111-4111-8111-111111111111";

  it("interpretIdentifierBatches empty without entityId", () => {
    const result = interpretIdentifierBatches({
      entityId: undefined,
      batches: [{ type: "domain", values: ["a.example.com"] }],
      claimText: "x",
      noEntitySummary: "none",
    });
    expect(result.patch).toEqual([]);
    expect(result.summary).toBe("none");
  });

  it("interpretIdentifierBatches multiple types + claim", () => {
    const result = interpretIdentifierBatches({
      entityId,
      batches: [
        { type: "email", values: ["a@b.com"] },
        { type: "domain", values: ["b.com"] },
        { type: "handle", values: ["alice"], platform: "gravatar" },
      ],
      claimText: "summary",
      noEntitySummary: "none",
    });
    expect(result.patch.length).toBe(4);
    expect(result.patch[0]?.data.type).toBe("email");
    expect(result.patch[1]?.data.type).toBe("domain");
    expect(result.patch[2]?.data.type).toBe("handle");
    expect(result.patch[2]?.data.platform).toBe("gravatar");
    expect(result.patch[3]?.resource).toBe("claim");
  });

  it("skips values that fail identifier validation", () => {
    const result = interpretIdentifierBatches({
      entityId,
      batches: [
        { type: "url", values: ["not a url", "https://ok.example/"] },
        { type: "domain", values: [null, "nodot", "ok.example"] },
      ],
      claimText: "summary",
      noEntitySummary: "none",
    });
    const ids = result.patch.filter((op) => op.resource === "identifier");
    expect(ids.map((op) => op.data.value)).toEqual([
      "https://ok.example",
      "ok.example",
    ]);
    expect(result.patch.at(-1)?.resource).toBe("claim");
  });
});
