import {
  Background,
  BackgroundVariant,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type EdgeMouseHandler,
  type NodeMouseHandler,
} from "@xyflow/react";
import { useEffect, type ReactNode } from "react";

import { EntityNode } from "@/shared/ui/graph/entity-node";
import { FitViewOnChange } from "@/shared/ui/graph/fit-view-on-change";
import { PredicateEdge } from "@/shared/ui/graph/predicate-edge";
import type {
  EntityFlowNode,
  PredicateFlowEdge,
} from "@/shared/ui/graph/types";
import { withConfidenceMarkers } from "@/shared/ui/graph/with-confidence-markers";

const nodeTypes = { entity: EntityNode };
const edgeTypes = { predicate: PredicateEdge };

export function GraphFlowCanvas({
  nodes: incomingNodes,
  edges: incomingEdges,
  onNodeClick,
  onNodeContextMenu,
  onEdgeClick,
  onPaneClick,
  minZoom = 0.25,
  maxZoom = 1.2,
  children,
}: {
  nodes: EntityFlowNode[];
  edges: PredicateFlowEdge[];
  onNodeClick?: NodeMouseHandler<EntityFlowNode>;
  onNodeContextMenu?: NodeMouseHandler<EntityFlowNode>;
  onEdgeClick?: EdgeMouseHandler<PredicateFlowEdge>;
  onPaneClick?: () => void;
  minZoom?: number;
  maxZoom?: number;
  children?: ReactNode;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState<EntityFlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<PredicateFlowEdge>([]);

  useEffect(() => {
    setNodes(incomingNodes);
    setEdges(withConfidenceMarkers(incomingEdges));
  }, [incomingNodes, incomingEdges, setNodes, setEdges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodesConnectable={false}
      edgesReconnectable={false}
      elementsSelectable
      panOnScroll
      panOnDrag
      zoomOnDoubleClick={false}
      maxZoom={maxZoom}
      minZoom={minZoom}
      proOptions={{ hideAttribution: true }}
      onNodeClick={onNodeClick}
      onNodeContextMenu={onNodeContextMenu}
      onEdgeClick={onEdgeClick}
      onPaneClick={onPaneClick}
      className="bg-muted/20!"
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={16}
        size={1}
        color="color-mix(in oklch, var(--muted-foreground) 25%, transparent)"
      />
      <FitViewOnChange nodeCount={nodes.length} edgeCount={edges.length} />
      {children}
    </ReactFlow>
  );
}
