import { Suspense, type ReactNode } from "react";

import { StackBodySkeleton } from "@/shared/ui/skeletons";

/**
 * Gate for stack / Detail tab panels: inactive → null; pending → skeleton;
 * else children. Prefer conditional unmount over React Activity for heavy
 * canvases (ego-graph, task board).
 */
export function ActiveTabBody({
  active,
  pending = false,
  pendingSections,
  children,
}: {
  active: boolean;
  pending?: boolean;
  pendingSections?: number;
  children: ReactNode;
}): ReactNode {
  if (!active) return null;
  if (pending) {
    return <StackBodySkeleton sections={pendingSections} />;
  }
  return children;
}

/** Suspense wrapper with StackBodySkeleton — use inside ActiveTabBody. */
export function SuspenseTabBody({ children }: { children: ReactNode }) {
  return <Suspense fallback={<StackBodySkeleton />}>{children}</Suspense>;
}
