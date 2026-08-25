import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Vertical spine (`border-l`) for timeline-style lists — events, questions.
 * Callers own spacing (`ml-*`, `pl-*`) and border color via `className`.
 */
export function TimelineSpine({
  children,
  className,
  dashed = true,
}: {
  children: ReactNode;
  className?: string;
  dashed?: boolean;
}) {
  return (
    <div
      className={cn(
        "border-border relative border-l",
        dashed && "border-dashed",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Dot marker positioned on a `TimelineSpine`. Caller supplies fill/border
 * color, size, and offset via `className` (differs per spine variant).
 */
export function TimelineDot({ className }: { className?: string }) {
  return (
    <span
      className={cn("ring-background absolute rounded-full ring-4", className)}
    />
  );
}
