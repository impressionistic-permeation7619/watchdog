import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/shared/ui/shadcn/scroll-area";

/** Queue column — sticky header + scroll body (EmptyState can flex-center). */
export function QueueShell({
  header,
  children,
  className,
  "aria-label": ariaLabel,
}: {
  header: ReactNode;
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <aside
      className={cn("flex h-full min-h-0 min-w-0 flex-col", className)}
      aria-label={ariaLabel}
    >
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex min-h-full flex-col">
          <div className="bg-background sticky top-0 z-20 shrink-0">
            {header}
          </div>
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
      </ScrollArea>
    </aside>
  );
}
