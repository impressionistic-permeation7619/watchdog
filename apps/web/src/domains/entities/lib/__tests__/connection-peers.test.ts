import { describe, it, expect } from "vitest";

import type { CaseEdgeRecord } from "../../edges/types.ts";
import { connectionPeersByEntityId } from "../connection-peers.ts";

function edge(
  partial: Pick<
    CaseEdgeRecord,
    | "id"
    | "fromId"
    | "fromName"
    | "fromKind"
    | "toId"
    | "toName"
    | "toKind"
    | "predicate"
  >
): CaseEdgeRecord {
  return {
    ...partial,
    fromSlug: partial.fromName.toLowerCase(),
    toSlug: partial.toName.toLowerCase(),
    confidence: "unverified",
    notes: null,
    evidenceIds: [],
  };
}

describe("connection-peers", () => {
  it("connectionPeersByEntityId indexes both endpoints", () => {
    const edges = [
      edge({
        id: "e1",
        fromId: "org1",
        fromName: "Acme",
        fromKind: "org",
        toId: "infra1",
        toName: "acme.com",
        toKind: "infra",
        predicate: "primary_domain",
      }),
    ];
    const map = connectionPeersByEntityId(edges);
    expect(map.get("org1")?.length).toBe(1);
    expect(map.get("org1")?.[0]?.peerName).toBe("acme.com");
    expect(map.get("org1")?.[0]?.direction).toBe("out");
    expect(map.get("infra1")?.[0]?.peerName).toBe("Acme");
    expect(map.get("infra1")?.[0]?.direction).toBe("in");
  });
});
