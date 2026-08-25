import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

type ComposerShellProps<T extends ElementType = "div"> = {
  children: ReactNode;
  className?: string;
  /** Nested edit/resolve forms use denser padding. */
  density?: "default" | "dense";
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

/**
 * Shared add/edit composer surface — `bg-muted/30` bordered block.
 * Extracted from repeated dossier composers.
 */
export function ComposerShell<T extends ElementType = "div">({
  children,
  className,
  density = "default",
  as,
  ...props
}: ComposerShellProps<T>) {
  const Comp = as ?? "div";
  return (
    <Comp
      className={cn(
        "bg-muted/30 flex flex-col gap-2 border",
        density === "default" ? "rounded-md p-3" : "rounded-md p-2.5",
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
