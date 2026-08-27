import type { ComponentProps } from "react";

import { STATUS_TONES } from "@/shared/ui/vocab/status.lib";
import {
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_TONE_MAP,
} from "@/shared/ui/vocab/task-priority.lib";
import { VocabBadge } from "@/shared/ui/vocab/vocab-badge";
import type { TaskPriority } from "@watchdog/schemas";

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
