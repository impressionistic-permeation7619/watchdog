import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useStore,
} from "@xyflow/react";
import type { EdgeProps } from "@xyflow/react";
import { useState } from "react";

import { getFloatingEdgeParams } from "@/shared/ui/graph/floating-edge";
import { confidenceStroke } from "@/shared/ui/graph/graph-styles";
import type { PredicateFlowEdge } from "@/shared/ui/graph/types";
import { predicateLabel } from "@/shared/ui/vocab";

type Props = EdgeProps<PredicateFlowEdge>;

/** Stable 0–1 from id — staggers label offsets without Math.random flicker. */
function idUnit(id: string): number {
  let h = 2_166_136_261;
  for (let i = 0; i < id.length; i += 1) {
    const code = id.codePointAt(i) ?? 0;
    h = Math.imul(h + code + i * 31, 16_777_619);
  }
  const positive = ((h % 1_000_000) + 1_000_000) % 1_000_000;
  return positive / 1_000_000;
}

function labelOffset(
  id: string,
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  labelX: number,
  labelY: number
): { x: number; y: number } {
  const dx = tx - sx;
  const dy = ty - sy;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const side = idUnit(id) >= 0.5 ? 1 : -1;
  const perp = 12 + idUnit(`${id}:perp`) * 14;
  const along = (idUnit(`${id}:along`) - 0.5) * Math.min(48, len * 0.18);
  const ux = dx / len;
  const uy = dy / len;

  return {
    x: labelX + nx * side * perp + ux * along,
    y: labelY + ny * side * perp + uy * along,
  };
}

export function PredicateEdge({
  id,
  source,
  target,
  data,
  style,
  markerEnd,
  selected,
}: Props) {
  const [hovered, setHovered] = useState(false);
  const zoom = useStore((s) => s.transform[2]);
  const sourceNode = useStore((s) => s.nodeLookup.get(source));
  const targetNode = useStore((s) => s.nodeLookup.get(target));

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getFloatingEdgeParams(
    sourceNode,
    targetNode
  );

  const curvature = 0.18 + idUnit(`${id}:curve`) * 0.22;
  const [edgePath, labelX, labelY] = getBezierPath({
    curvature,
    sourcePosition: sourcePos,
    sourceX: sx,
    sourceY: sy,
    targetPosition: targetPos,
    targetX: tx,
    targetY: ty,
  });

  const stroke =
    style?.stroke ?? confidenceStroke(data?.confidence ?? "unverified");

  const showLabel =
    Boolean(data?.predicate) && ((selected ?? hovered) || zoom >= 0.55);

  const offset = labelOffset(id, sx, sy, tx, ty, labelX, labelY);
  const label = data?.predicate ? predicateLabel(data.predicate, "out") : "";

  return (
    <>
      <g
        onMouseEnter={() => {
          setHovered(true);
        }}
        onMouseLeave={() => {
          setHovered(false);
        }}
      >
        <BaseEdge
          id={id}
          path={edgePath}
          markerEnd={markerEnd}
          interactionWidth={24}
          style={{
            ...style,
            stroke,
            strokeWidth: selected || hovered ? 2.25 : 1.5,
          }}
        />
      </g>
      {showLabel ? (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan bg-background/95 text-muted-foreground ring-border text-chip pointer-events-none absolute z-10 max-w-[9rem] truncate rounded px-1.5 py-0.5 whitespace-nowrap shadow-sm ring-1"
            style={{
              transform: `translate(-50%, -50%) translate(${offset.x}px,${offset.y}px)`,
            }}
            title={label}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}
