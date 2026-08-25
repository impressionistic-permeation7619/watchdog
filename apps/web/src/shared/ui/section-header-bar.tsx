import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { SectionLabel } from "@/shared/ui/section-label";

type SectionHeaderBarVariant = "sticky" | "panel" | "inline";

/**
 * Title + optional count + optional trailing action.
 * Presentational only.
 */
export function SectionHeaderBar({
  title,
  count,
  action,
  variant = "inline",
  className,
  as = "h3",
}: {
  title: ReactNode;
  count?: number;
  action?: ReactNode;
  variant?: SectionHeaderBarVariant;
  className?: string;
  as?: ElementType;
}) {
  return (
    <div
      data-slot="section-header-bar"
      data-variant={variant}
      className={cn(
        "flex items-center justify-between gap-2",
        variant === "sticky" &&
          // top-10 = QueueHeader h-10 — day strips stick under the queue title.
          "border-border bg-sidebar sticky top-10 z-10 border-b px-3 py-1.5",
        variant === "panel" && "border-border bg-muted/30 border-b px-3 py-1.5",
        variant === "inline" && "flex-wrap items-baseline",
        className
      )}
    >
      <SectionLabel
        as={as}
        density={variant === "panel" ? "compact" : "default"}
      >
        {title}
        {typeof count === "number" ? (
          <span className="text-muted-foreground ml-2 font-mono font-normal normal-case tabular-nums">
            {count}
          </span>
        ) : null}
      </SectionLabel>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
