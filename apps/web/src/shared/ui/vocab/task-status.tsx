/* oxlint-disable react/only-export-components -- vocab labels/tones + badge */
import type { ComponentProps } from "react";

import type { DisplayStatus } from "@/shared/ui/vocab/status";
import { STATUS_TONES } from "@/shared/ui/vocab/status";
import { optionsFromLabels } from "@/shared/ui/vocab/title-case";
import { VocabBadge } from "@/shared/ui/vocab/vocab-badge";
import { TASK_STATUSES, type TaskStatus } from "@watchdog/schemas";

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  in_progress: "In Progress",
  blocked: "Blocked",
  done: "Done",
  dropped: "Dropped",
};

/** Map task statuses onto existing `--status-*` token tones. */
const TASK_STATUS_TONE_MAP: Record<TaskStatus, DisplayStatus> = {
  backlog: "pending",
  in_progress: "running",
  blocked: "queued",
  done: "succeeded",
  dropped: "cancelled",
};

export const TASK_STATUS_OPTIONS = optionsFromLabels(
  TASK_STATUSES,
  TASK_STATUS_LABELS
);

export function taskStatusLabel(status: TaskStatus): string {
  return TASK_STATUS_LABELS[status];
}

type TaskStatusBadgeProps = Omit<
  ComponentProps<typeof VocabBadge>,
  "label" | "tone"
> & {
  status: TaskStatus;
};

export function TaskStatusBadge({
  status,
  contrast = "low",
  className,
  children,
  ...props
}: TaskStatusBadgeProps) {
  return (
    <VocabBadge
      label={TASK_STATUS_LABELS[status]}
      tone={STATUS_TONES[TASK_STATUS_TONE_MAP[status]]}
      contrast={contrast}
      className={className}
      {...props}
    >
      {children}
    </VocabBadge>
  );
}

export { TASK_STATUS_TONE_MAP };
