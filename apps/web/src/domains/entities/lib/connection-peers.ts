import type { CaseEdgeRecord } from "@/domains/entities/edges/types";
import type {
  EdgeDirection,
  EdgePredicate,
  EntityKind,
} from "@watchdog/schemas";

export interface EntityConnectionPeer {
  edgeId: string;
  peerId: string;
  peerName: string;
  peerKind: EntityKind;
  predicate: EdgePredicate;
  direction: EdgeDirection;
  notes: string | null;
  fromId: string;
  toId: string;
}

/** Map entityId → connected peers (both directions), sorted by peer name. */
export function connectionPeersByEntityId(
  edges: readonly CaseEdgeRecord[]
): Map<string, EntityConnectionPeer[]> {
  const map = new Map<string, EntityConnectionPeer[]>();

  function push(entityId: string, peer: EntityConnectionPeer) {
    const list = map.get(entityId);
    if (list) {
      list.push(peer);
      return;
    }
    map.set(entityId, [peer]);
  }

  for (const edge of edges) {
    const shared = {
      edgeId: edge.id,
      predicate: edge.predicate,
      notes: edge.notes,
      fromId: edge.fromId,
      toId: edge.toId,
    };
    push(edge.fromId, {
      ...shared,
      peerId: edge.toId,
      peerName: edge.toName,
      peerKind: edge.toKind,
      direction: "out",
    });
    push(edge.toId, {
      ...shared,
      peerId: edge.fromId,
      peerName: edge.fromName,
      peerKind: edge.fromKind,
      direction: "in",
    });
  }

  for (const list of map.values()) {
    list.sort((a, b) => a.peerName.localeCompare(b.peerName));
  }
  return map;
}
