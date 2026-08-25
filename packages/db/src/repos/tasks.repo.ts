import { and, asc, eq, ilike, isNull, max, or } from "drizzle-orm";

import type { TaskPriority, TaskStatus } from "@watchdog/schemas";

import type { DbExec } from "../exec";
import { tasks } from "../schema/tasks";
import { containsPattern } from "./_ilike";

export const taskColumns = {
  id: tasks.id,
  caseId: tasks.caseId,
  entityId: tasks.entityId,
  title: tasks.title,
  description: tasks.description,
  status: tasks.status,
  priority: tasks.priority,
  dueDate: tasks.dueDate,
  position: tasks.position,
  createdAt: tasks.createdAt,
  updatedAt: tasks.updatedAt,
} as const;

export type TaskRow = {
  [K in keyof typeof taskColumns]: (typeof tasks.$inferSelect)[K &
    keyof typeof tasks.$inferSelect];
};

export type NewTask = Pick<
  typeof tasks.$inferInsert,
  "caseId" | "title" | "status"
> &
  Partial<
    Pick<
      typeof tasks.$inferInsert,
      "id" | "entityId" | "description" | "priority" | "dueDate" | "position"
    >
  >;

export type TaskPatch = Partial<
  Pick<
    typeof tasks.$inferInsert,
    | "title"
    | "description"
    | "status"
    | "priority"
    | "dueDate"
    | "entityId"
    | "position"
  >
>;

export interface ListTasksRowsOpts {
  entityId?: string;
  /** When true, only rows with entityId IS NULL. */
  unattachedOnly?: boolean;
  status?: TaskStatus;
}

export const tasksRepo = {
  async listForCase(
    exec: DbExec,
    caseId: string,
    opts?: ListTasksRowsOpts
  ): Promise<TaskRow[]> {
    return exec
      .select(taskColumns)
      .from(tasks)
      .where(
        and(
          eq(tasks.caseId, caseId),
          opts?.entityId === undefined
            ? undefined
            : eq(tasks.entityId, opts.entityId),
          opts?.unattachedOnly === true ? isNull(tasks.entityId) : undefined,
          opts?.status === undefined ? undefined : eq(tasks.status, opts.status)
        )
      )
      .orderBy(asc(tasks.position), asc(tasks.createdAt));
  },

  async searchForCase(
    exec: DbExec,
    caseId: string,
    term: string,
    limit: number
  ): Promise<TaskRow[]> {
    const pattern = containsPattern(term);
    if (pattern === null) return [];
    return exec
      .select(taskColumns)
      .from(tasks)
      .where(
        and(
          eq(tasks.caseId, caseId),
          or(ilike(tasks.title, pattern), ilike(tasks.description, pattern))
        )
      )
      .orderBy(asc(tasks.title))
      .limit(limit);
  },

  async getInCase(
    exec: DbExec,
    caseId: string,
    taskId: string
  ): Promise<TaskRow | null> {
    const [row] = await exec
      .select(taskColumns)
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.caseId, caseId)))
      .limit(1);
    return row ?? null;
  },

  async create(exec: DbExec, values: NewTask): Promise<TaskRow | null> {
    const status = values.status ?? "backlog";
    const position =
      values.position ??
      (await tasksRepo.nextPosition(exec, values.caseId, status));
    const [created] = await exec
      .insert(tasks)
      .values({ ...values, status, position })
      .returning(taskColumns);
    return created ?? null;
  },

  async update(
    exec: DbExec,
    taskId: string,
    patch: TaskPatch
  ): Promise<TaskRow | null> {
    const [updated] = await exec
      .update(tasks)
      .set(patch)
      .where(eq(tasks.id, taskId))
      .returning(taskColumns);
    return updated ?? null;
  },

  async remove(exec: DbExec, taskId: string): Promise<boolean> {
    const deleted = await exec
      .delete(tasks)
      .where(eq(tasks.id, taskId))
      .returning({ id: tasks.id });
    return deleted.length > 0;
  },

  async nextPosition(
    exec: DbExec,
    caseId: string,
    status: TaskStatus
  ): Promise<number> {
    const [row] = await exec
      .select({ max: max(tasks.position) })
      .from(tasks)
      .where(and(eq(tasks.caseId, caseId), eq(tasks.status, status)));
    return (row?.max ?? -1) + 1;
  },

  async rewriteOrder(
    exec: DbExec,
    caseId: string,
    status: TaskStatus,
    orderedIds: readonly string[]
  ): Promise<void> {
    await Promise.all(
      orderedIds.map((id, index) =>
        exec
          .update(tasks)
          .set({ position: index })
          .where(
            and(
              eq(tasks.id, id),
              eq(tasks.caseId, caseId),
              eq(tasks.status, status)
            )
          )
      )
    );
  },
};

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
