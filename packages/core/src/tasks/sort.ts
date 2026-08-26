import type { TaskRow } from "@watchdog/db";
import type { TaskPriority } from "@watchdog/schemas";

/** Priority rank for deterministic board/list sort (higher = first). */
export function taskPriorityRank(priority: TaskPriority | null): number {
  switch (priority) {
    case "urgent": {
      return 4;
    }
    case "high": {
      return 3;
    }
    case "medium": {
      return 2;
    }
    case "low": {
      return 1;
    }
    case null: {
      return 0;
    }
    default: {
      const _exhaustive: never = priority;
      return _exhaustive;
    }
  }
}

/** Stable sort: priority desc → due date asc (nulls last) → createdAt asc. */
export function compareTaskRows(a: TaskRow, b: TaskRow): number {
  const byPriority =
    taskPriorityRank(b.priority ?? null) - taskPriorityRank(a.priority ?? null);
  if (byPriority !== 0) return byPriority;
  const aDue = a.dueDate?.getTime() ?? Number.POSITIVE_INFINITY;
  const bDue = b.dueDate?.getTime() ?? Number.POSITIVE_INFINITY;
  if (aDue !== bDue) return aDue - bDue;
  return a.createdAt.getTime() - b.createdAt.getTime();
}
