import type { ComponentProps } from "react";

import {
  PATCH_OP_LABELS,
  PATCH_OP_TONES,
} from "@/shared/ui/vocab/patch-op.lib";
import { VocabBadge } from "@/shared/ui/vocab/vocab-badge";
import type { PatchOp } from "@watchdog/schemas";

type Op = PatchOp["op"];

type PatchOpBadgeProps = Omit<
  ComponentProps<typeof VocabBadge>,
  "label" | "tone"
> & {
  op: Op;
};

export function PatchOpBadge({
  op,
  contrast = "low",
  className,
  children,
  ...props
}: PatchOpBadgeProps) {
  return (
    <VocabBadge
      label={PATCH_OP_LABELS[op]}
      tone={PATCH_OP_TONES[op]}
      contrast={contrast}
      className={className}
      {...props}
    >
      {children}
    </VocabBadge>
  );
}
