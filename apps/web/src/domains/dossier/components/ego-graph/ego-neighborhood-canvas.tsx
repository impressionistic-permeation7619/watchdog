import { useNavigate } from "@tanstack/react-router";
import type { EdgeMouseHandler, NodeMouseHandler } from "@xyflow/react";
import { useCallback, useMemo, useState } from "react";

import type { EdgeRecord } from "@/domains/entities/edges/edges.functions";
import { cn } from "@/lib/utils";
import { GraphFlowCanvas, GraphFlowShell } from "@/shared/ui/graph";
import { predicateLabel } from "@/shared/ui/vocab";

import {
  edgesToEgoFlow,
  type EgoEntityRef,
  type EntityFlowNode,
  type PredicateFlowEdge,
} from "./edges-to-flow";
import { EgoNodeMenu, type EgoMenuNode } from "./ego-node-menu";

export function EgoNeighborhoodCanvas({
  center,
  edges,
  className,
  fillHeight = false,
  onEditEdge,
}: {
  center: EgoEntityRef;
  edges: EdgeRecord[];
  className?: string;
  fillHeight?: boolean;
  onEditEdge?: (edgeId: string) => void;
}) {
  const navigate = useNavigate();
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    node: EgoMenuNode;
  } | null>(null);

  const flow = useMemo(
    () => edgesToEgoFlow({ center, edges }),
    [center, edges]
  );

  const openMenu = useCallback((node: EntityFlowNode, x: number, y: number) => {
    setMenu({
      x,
      y,
      node: {
        id: node.id,
        label: node.data.label,
        slug: node.data.slug,
      },
    });
  }, []);

  const onNodeClick: NodeMouseHandler<EntityFlowNode> = useCallback(
    (event, node) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("[data-entity-menu]")
      ) {
        event.preventDefault();
        event.stopPropagation();
        openMenu(node, event.clientX, event.clientY);
        return;
      }
      if (node.id === center.id) {
        return;
      }
      setMenu(null);
      void navigate({
        to: "/entities/$entitySlug",
        params: { entitySlug: node.data.slug },
        search: { tab: "connections" },
      });
    },
    [center.id, navigate, openMenu]
  );

  const onNodeContextMenu: NodeMouseHandler<EntityFlowNode> = useCallback(
    (event, node) => {
      event.preventDefault();
      event.stopPropagation();
      if (node.id === center.id) return;
      openMenu(node, event.clientX, event.clientY);
    },
    [center.id, openMenu]
  );

  const onEdgeClick: EdgeMouseHandler<PredicateFlowEdge> = useCallback(
    (_event, edge) => {
      const edgeId = edge.data?.edgeId ?? edge.id;
      onEditEdge?.(edgeId);
    },
    [onEditEdge]
  );

  const shell = cn(
    "border-border overflow-hidden rounded-lg border",
    fillHeight ? "min-h-64 flex-1" : "h-64",
    className
  );

  if (flow.nodes.length <= 1) {
    return (
      <div className={cn(shell, "flex items-center p-3")}>
        <p className="text-muted-foreground text-xs">
          No neighbors in the 1-hop graph yet.
        </p>
      </div>
    );
  }

  return (
    <GraphFlowShell className={shell}>
      <GraphFlowCanvas
        nodes={flow.nodes}
        edges={flow.edges}
        minZoom={0.3}
        onNodeClick={onNodeClick}
        onNodeContextMenu={onNodeContextMenu}
        onEdgeClick={onEdgeClick}
        onPaneClick={() => {
          setMenu(null);
        }}
      />
      {menu ? (
        <EgoNodeMenu
          x={menu.x}
          y={menu.y}
          node={menu.node}
          connections={flow.edges
            .filter(
              (e) => e.source === menu.node.id || e.target === menu.node.id
            )
            .map((e) => ({
              edgeId: e.data?.edgeId ?? e.id,
              label: predicateLabel(e.data?.predicate ?? "", "out"),
            }))}
          onClose={() => {
            setMenu(null);
          }}
          onEditEdge={onEditEdge}
        />
      ) : null}
    </GraphFlowShell>
  );
}
