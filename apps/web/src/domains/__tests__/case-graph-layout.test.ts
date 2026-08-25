import { describe, it, expect } from "vitest";

import { caseGraphLayout } from "../cases/components/case-graph/case-graph-layout.ts";

describe("case-graph-layout", () => {
  it("caseGraphLayout emits one node per entity and one edge per relation", () => {
    const entities = [
      {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Alice",
        slug: "alice",
        kind: "person" as const,
      },
      {
        id: "22222222-2222-4222-8222-222222222222",
        name: "Acme",
        slug: "acme",
        kind: "org" as const,
      },
    ];
    const edges = [
      {
        id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        fromId: entities[0].id,
        toId: entities[1].id,
        predicate: "owns",
        confidence: "possible",
      },
    ];

    const flow = caseGraphLayout({ entities, edges });
    expect(flow.nodes.length).toBe(2);
    expect(flow.edges.length).toBe(1);
    expect(flow.edges[0]?.source).toBe(entities[0].id);
    expect(flow.edges[0]?.target).toBe(entities[1].id);
    expect(
      flow.nodes.every((n) => typeof n.position.x === "number")
    ).toBeTruthy();
    expect(
      flow.nodes.every((n) => typeof n.position.y === "number")
    ).toBeTruthy();
  });
});
