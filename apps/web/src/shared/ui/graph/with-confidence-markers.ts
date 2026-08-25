import { MarkerType } from "@xyflow/react";

import type { PredicateFlowEdge } from "@/shared/ui/graph/types";

/** Attach ArrowClosed markers colored from edge stroke (when present). */
export function withConfidenceMarkers(
  edges: PredicateFlowEdge[],
  opts?: { width?: number; height?: number }
): PredicateFlowEdge[] {
  const width = opts?.width ?? 16;
  const height = opts?.height ?? 16;
  return edges.map((e) => {
    const stroke =
      typeof e.style?.stroke === "string" ? e.style.stroke : undefined;
    return {
      ...e,
      markerEnd:
        stroke === undefined
          ? { type: MarkerType.ArrowClosed, width, height }
          : {
              type: MarkerType.ArrowClosed,
              width,
              height,
              color: stroke,
            },
    };
  });
}
