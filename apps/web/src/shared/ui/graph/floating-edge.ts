import { Position } from "@xyflow/react";
import type { InternalNode, XYPosition } from "@xyflow/react";

/** Intersection of the line between node centers with the source node's border. */
function getNodeIntersection(
  intersectionNode: InternalNode,
  targetNode: InternalNode
): XYPosition {
  const { width: wRaw, height: hRaw } = intersectionNode.measured ?? {
    height: 0,
    width: 0,
  };
  const w = (wRaw ?? 0) / 2;
  const h = (hRaw ?? 0) / 2;
  if (w === 0 || h === 0) {
    return {
      x: intersectionNode.internals.positionAbsolute.x,
      y: intersectionNode.internals.positionAbsolute.y,
    };
  }

  const x2 = intersectionNode.internals.positionAbsolute.x + w;
  const y2 = intersectionNode.internals.positionAbsolute.y + h;
  const x1 =
    targetNode.internals.positionAbsolute.x +
    (targetNode.measured?.width ?? 0) / 2;
  const y1 =
    targetNode.internals.positionAbsolute.y +
    (targetNode.measured?.height ?? 0) / 2;

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h);
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h);
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1) || 1);
  const xx3 = a * xx1;
  const yy3 = a * yy1;

  return {
    x: w * (xx3 + yy3) + x2,
    y: h * (-xx3 + yy3) + y2,
  };
}

function getEdgePosition(
  node: InternalNode,
  intersectionPoint: XYPosition
): Position {
  const nx = Math.round(node.internals.positionAbsolute.x);
  const ny = Math.round(node.internals.positionAbsolute.y);
  const px = Math.round(intersectionPoint.x);
  const py = Math.round(intersectionPoint.y);
  const width = node.measured?.width ?? 0;
  const height = node.measured?.height ?? 0;

  if (px <= nx + 1) {
    return Position.Left;
  }
  if (px >= nx + width - 1) {
    return Position.Right;
  }
  if (py <= ny + 1) {
    return Position.Top;
  }
  if (py >= ny + height - 1) {
    return Position.Bottom;
  }
  return Position.Top;
}

/** Dynamic source/target points for floating layouts (xyflow). */
export function getFloatingEdgeParams(
  source: InternalNode,
  target: InternalNode
) {
  const sourceIntersectionPoint = getNodeIntersection(source, target);
  const targetIntersectionPoint = getNodeIntersection(target, source);

  return {
    sourcePos: getEdgePosition(source, sourceIntersectionPoint),
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    targetPos: getEdgePosition(target, targetIntersectionPoint),
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
  };
}
