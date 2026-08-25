import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

const BASE =
  "text-label-meta text-muted-foreground normal-case tracking-normal";

interface SectionLabelProps {
  children: ReactNode;
  className?: string;
  /** Dense dossier rails (slightly smaller). */
  density?: "default" | "compact";
  as?: ElementType;
}

export function SectionLabel({
  children,
  className,
  density = "default",
  as: Comp = "h2",
}: SectionLabelProps) {
  return (
    <Comp
      className={cn(
        BASE,
        density === "compact" && "text-label-meta-sm",
        className
      )}
    >
      {children}
    </Comp>
  );
}
