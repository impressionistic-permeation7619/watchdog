import type { ComponentProps } from "react";

import { STATUS_TONES } from "@/shared/ui/vocab/status.lib";
import {
  TASK_STATUS_LABELS,
  TASK_STATUS_TONE_MAP,
} from "@/shared/ui/vocab/task-status.lib";
import { VocabBadge } from "@/shared/ui/vocab/vocab-badge";
import type { TaskStatus } from "@watchdog/schemas";

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
