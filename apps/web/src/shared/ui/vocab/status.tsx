import type { ComponentProps } from "react";

import {
  STATUS_LABELS,
  STATUS_TONES,
  type DisplayStatus,
} from "@/shared/ui/vocab/status.lib";
import { VocabBadge } from "@/shared/ui/vocab/vocab-badge";

type StatusBadgeProps = Omit<
  ComponentProps<typeof VocabBadge>,
  "label" | "tone"
> & {
  status: DisplayStatus;
};

export function StatusBadge({
  status,
  contrast = "low",
  className,
  children,
  ...props
}: StatusBadgeProps) {
  return (
    <VocabBadge
      label={STATUS_LABELS[status]}
      tone={STATUS_TONES[status]}
      contrast={contrast}
      className={className}
      {...props}
    >
      {children}
    </VocabBadge>
  );
}
