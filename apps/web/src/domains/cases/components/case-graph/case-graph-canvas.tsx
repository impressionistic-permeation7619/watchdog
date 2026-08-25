import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { NodeMouseHandler } from "@xyflow/react";
import { useMemo } from "react";

import {
  CASE_GRAPH_ENTITY_CAP,
  caseGraphLayout,
} from "@/domains/cases/components/case-graph/case-graph-layout";
import { edgesForCaseQuery } from "@/domains/entities/edges/queries";
import type { EntityRecord } from "@/domains/entities/types";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/shared/ui/empty-state";
import {
  GraphFlowCanvas,
  GraphFlowShell,
  type EntityFlowNode,
} from "@/shared/ui/graph";

export function CaseGraphCanvas({
  caseId,
  entities,
  className,
}: {
  caseId: string;
  entities: EntityRecord[];
  className?: string;
}) {
  const navigate = useNavigate();
  const { data: edges } = useSuspenseQuery(edgesForCaseQuery(caseId));

  const flow = useMemo(
    () =>
      caseGraphLayout({
        entities: entities.map((e) => ({
          id: e.id,
          name: e.name,
          slug: e.slug,
          kind: e.kind,
        })),
        edges,
      }),
    [entities, edges]
  );

  const onNodeClick: NodeMouseHandler<EntityFlowNode> = (_event, node) => {
    void navigate({
      to: "/entities/$entitySlug",
      params: { entitySlug: node.data.slug },
    });
  };

  if (entities.length === 0) {
    return (
      <EmptyState
        intent="blank-slate"
        items="connections"
        title="No entities yet"
        description="Add entities to see a case-wide graph preview."
      />
    );
  }

  if (entities.length > CASE_GRAPH_ENTITY_CAP) {
    return (
      <EmptyState
        intent="no-results"
        items="entities"
        title={`Graph preview caps at ${CASE_GRAPH_ENTITY_CAP} entities`}
        description="Open individual Connections tabs on entity dossiers to explore the graph."
      />
    );
  }

  return (
    <GraphFlowShell
      className={cn(
        "border-border h-[min(70vh,36rem)] min-h-[24rem] overflow-hidden rounded-md border",
        className
      )}
    >
      <GraphFlowCanvas
        nodes={flow.nodes}
        edges={flow.edges}
        onNodeClick={onNodeClick}
      />
    </GraphFlowShell>
  );
}
