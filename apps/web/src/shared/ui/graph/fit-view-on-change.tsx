import { useReactFlow } from "@xyflow/react";
import { useEffect } from "react";

/** Re-fit the viewport when node/edge counts change. */
export function FitViewOnChange({
  nodeCount,
  edgeCount,
  padding = 0.2,
}: {
  nodeCount: number;
  edgeCount: number;
  padding?: number;
}) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      void fitView({ padding, duration: 200 });
    });
    return () => {
      window.cancelAnimationFrame(id);
    };
  }, [fitView, nodeCount, edgeCount, padding]);
  return null;
}
