import type { DisplayStatus } from "@/shared/ui/vocab/status.lib";
import { optionsFromLabels } from "@/shared/ui/vocab/title-case";
import { TASK_STATUSES, type TaskStatus } from "@watchdog/schemas";

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  in_progress: "In Progress",
  blocked: "Blocked",
  done: "Done",
  dropped: "Dropped",
};

/** Map task statuses onto existing `--status-*` token tones. */
export const TASK_STATUS_TONE_MAP: Record<TaskStatus, DisplayStatus> = {
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

export { TASK_STATUS_LABELS };
