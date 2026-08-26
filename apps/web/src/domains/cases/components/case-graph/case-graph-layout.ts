import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
} from "d3-force";

import type {
  ConfidenceTier,
  EdgePredicate,
  EntityKind,
} from "@watchdog/schemas";

import { confidenceStroke } from "../../../../shared/ui/graph/graph-styles.ts";
import type {
  EntityFlowNode,
  PredicateFlowEdge,
} from "../../../../shared/ui/graph/types.ts";

export interface CaseGraphEntity {
  id: string;
  name: string;
  slug: string;
  kind: EntityKind;
}

export interface CaseGraphEdgeInput {
  id: string;
  fromId: string;
  toId: string;
  predicate: EdgePredicate;
  confidence: ConfidenceTier;
}

export const CASE_GRAPH_ENTITY_CAP = 150;

interface SimNode {
  id: string;
  x: number;
  y: number;
  index?: number;
  vx?: number;
  vy?: number;
}

interface SimLink {
  source: string | SimNode;
  target: string | SimNode;
}

export function caseGraphLayout({
  entities,
  edges,
}: {
  entities: CaseGraphEntity[];
  edges: CaseGraphEdgeInput[];
}): { nodes: EntityFlowNode[]; edges: PredicateFlowEdge[] } {
  const entityIds = new Set(entities.map((e) => e.id));
  const simNodes: SimNode[] = entities.map((e) => ({
    id: e.id,
    x: 0,
    y: 0,
  }));
  const scopedEdges = edges.filter(
    (e) => entityIds.has(e.fromId) && entityIds.has(e.toId)
  );
  const simLinks: SimLink[] = scopedEdges.map((e) => ({
    source: e.fromId,
    target: e.toId,
  }));

  const simulation = forceSimulation(simNodes)
    .force(
      "link",
      forceLink<SimNode, SimLink>(simLinks)
        .id((d) => d.id)
        .distance(140)
        .strength(0.4)
    )
    .force("charge", forceManyBody().strength(-280))
    .force("center", forceCenter(0, 0))
    .force("collide", forceCollide(56))
    .stop();

  const ticks = Math.min(300, Math.max(80, simNodes.length * 4));
  for (let i = 0; i < ticks; i += 1) {
    simulation.tick();
  }

  const nodes: EntityFlowNode[] = entities.map((entity, i) => ({
    id: entity.id,
    type: "entity",
    position: {
      x: simNodes[i]?.x ?? 0,
      y: simNodes[i]?.y ?? 0,
    },
    data: {
      label: entity.name,
      kind: entity.kind,
      slug: entity.slug,
      isCenter: false,
      showMenu: false,
    },
  }));

  const flowEdges: PredicateFlowEdge[] = scopedEdges.map((e) => ({
    id: e.id,
    type: "predicate",
    source: e.fromId,
    target: e.toId,
    data: {
      predicate: e.predicate,
      confidence: e.confidence,
      edgeId: e.id,
    },
    style: { stroke: confidenceStroke(e.confidence) },
  }));

  return { nodes, edges: flowEdges };
}
