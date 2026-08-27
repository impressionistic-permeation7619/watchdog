/* oxlint-disable react/only-export-components -- vocab labels/tones + badge */
import type { ComponentProps } from "react";

import type { DisplayStatus } from "@/shared/ui/vocab/status";
import { STATUS_TONES } from "@/shared/ui/vocab/status";
import { optionsFromLabels } from "@/shared/ui/vocab/title-case";
import { VocabBadge } from "@/shared/ui/vocab/vocab-badge";
import { TASK_PRIORITIES, type TaskPriority } from "@watchdog/schemas";

const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

/** Map priorities onto existing `--status-*` token tones. */
const TASK_PRIORITY_TONE_MAP: Record<TaskPriority, DisplayStatus> = {
  urgent: "failed",
  high: "pending",
  medium: "running",
  low: "unknown",
};

export const TASK_PRIORITY_OPTIONS = optionsFromLabels(
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS
);

export function taskPriorityLabel(priority: TaskPriority): string {
  return TASK_PRIORITY_LABELS[priority];
}

type TaskPriorityBadgeProps = Omit<
  ComponentProps<typeof VocabBadge>,
  "label" | "tone"
> & {
  priority: TaskPriority;
};

export function TaskPriorityBadge({
  priority,
  contrast = "low",
  className,
  children,
  ...props
}: TaskPriorityBadgeProps) {
  return (
    <VocabBadge
      label={TASK_PRIORITY_LABELS[priority]}
      tone={STATUS_TONES[TASK_PRIORITY_TONE_MAP[priority]]}
      contrast={contrast}
      className={className}
      {...props}
    >
      {children}
    </VocabBadge>
  );
}

export { TASK_PRIORITY_TONE_MAP };
