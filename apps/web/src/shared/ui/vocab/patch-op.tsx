/* oxlint-disable react/only-export-components -- vocab labels/tones + badge components */
import {
  CalendarIcon,
  CircleHelpIcon,
  FingerprintIcon,
  GitBranchIcon,
  MessageSquareTextIcon,
  UserRoundIcon,
} from "lucide-react";
import type { ComponentProps, ComponentType } from "react";

import { titleCase } from "@/shared/ui/vocab/title-case";
import type { VocabTone } from "@/shared/ui/vocab/vocab-badge";
import { VocabBadge } from "@/shared/ui/vocab/vocab-badge";
import type { PatchOp } from "@watchdog/schemas";

type Op = PatchOp["op"];
type Resource = PatchOp["resource"];

export const PATCH_OP_LABELS: Record<Op, string> = {
  create: "Create",
  upsert: "Upsert",
  update: "Update",
};

/** Bind patch ops to status-domain tones (not freestyle success/warning). */
const PATCH_OP_TONES: Record<Op, VocabTone> = {
  create: {
    low: "bg-status-succeeded-bg text-status-succeeded-fg",
    high: "bg-status-succeeded text-primary-foreground",
  },
  upsert: {
    low: "bg-status-running-bg text-status-running-fg",
    high: "bg-status-running text-primary-foreground",
  },
  update: {
    low: "bg-status-pending-bg text-status-pending-fg",
    high: "bg-status-pending text-signal-foreground",
  },
};

export const PATCH_RESOURCE_META: Record<
  Resource,
  { label: string; Icon: ComponentType<{ className?: string }> }
> = {
  claim: { label: "Claim", Icon: MessageSquareTextIcon },
  identifier: { label: "Identifier", Icon: FingerprintIcon },
  edge: { label: "Connection", Icon: GitBranchIcon },
  entity: { label: "Entity", Icon: UserRoundIcon },
  event: { label: "Event", Icon: CalendarIcon },
  question: { label: "Question", Icon: CircleHelpIcon },
};

export function patchOpLabel(op: Op): string {
  return PATCH_OP_LABELS[op] ?? titleCase(op);
}

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
