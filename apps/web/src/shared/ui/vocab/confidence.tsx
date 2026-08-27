import type { ComponentProps } from "react";

import {
  CONFIDENCE_LABELS,
  CONFIDENCE_TONES,
} from "@/shared/ui/vocab/confidence.lib";
import { VocabBadge } from "@/shared/ui/vocab/vocab-badge";
import type { ConfidenceTier } from "@watchdog/schemas";

type ConfidenceBadgeProps = Omit<
  ComponentProps<typeof VocabBadge>,
  "label" | "tone"
> & {
  confidence: ConfidenceTier;
};

export function ConfidenceBadge({
  confidence,
  contrast = "low",
  className,
  children,
  ...props
}: ConfidenceBadgeProps) {
  return (
    <VocabBadge
      label={CONFIDENCE_LABELS[confidence]}
      tone={CONFIDENCE_TONES[confidence]}
      contrast={contrast}
      className={className}
      {...props}
    >
      {children}
    </VocabBadge>
  );
}
