import { ReactFlowProvider } from "@xyflow/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { useHydrated } from "@/shared/hooks/use-hydrated";
import { GraphCanvasSkeleton } from "@/shared/ui/graph/graph-canvas-skeleton";

export function GraphFlowShell({
  className,
  pending,
  children,
}: {
  className?: string;
  /** Override hydration placeholder. Default = `GraphCanvasSkeleton` (no copy). */
  pending?: ReactNode;
  children: ReactNode;
}) {
  const hydrated = useHydrated();

  if (!hydrated) {
    return (
      <div className={cn(className)}>
        {pending ?? <GraphCanvasSkeleton />}
      </div>
    );
  }

  return (
    <div className={cn(className)}>
      <ReactFlowProvider>{children}</ReactFlowProvider>
    </div>
  );
}
