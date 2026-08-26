import type { Edge, Node } from "@xyflow/react";

import type {
  ConfidenceTier,
  EdgePredicate,
  EntityKind,
} from "@watchdog/schemas";

export interface EntityNodeData extends Record<string, unknown> {
  label: string;
  kind: EntityKind;
  slug: string;
  isCenter: boolean;
  /** Ego peer ⋯ menu. */
  showMenu?: boolean;
}

export interface PredicateEdgeData extends Record<string, unknown> {
  predicate: EdgePredicate;
  confidence: ConfidenceTier;
  edgeId: string;
}

export type EntityFlowNode = Node<EntityNodeData, "entity">;
export type PredicateFlowEdge = Edge<PredicateEdgeData, "predicate">;
