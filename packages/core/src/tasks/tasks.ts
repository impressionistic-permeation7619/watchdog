import { activityEventsRepo, db, tasksRepo, type DbExec, type TaskRow } from "@watchdog/db";
import {
  trimmedOrNull,
  type TaskPriority,
  type TaskStatus,
} from "@watchdog/schemas";

import { assertCaseExists, assertEntityInCase } from "../graph/patch/guards";
import { DomainError } from "../infra/domain-error";
import { notifyTaskChanged } from "../infra/events";

export interface TaskRecord {
  id: string;
  caseId: string;
  entityId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority | null;
  dueDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  caseId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority | null;
  dueDate?: string | null;
  entityId?: string | null;
}

export interface UpdateTaskInput {
  caseId: string;
  taskId: string;
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority | null;
  dueDate?: string | null;
  entityId?: string | null;
}

export interface ListTasksOpts {
  entityId?: string;
  unattachedOnly?: boolean;
  status?: TaskStatus;
}

function toRecord(row: TaskRow): TaskRecord {
  return {
    id: row.id,
    caseId: row.caseId,
    entityId: row.entityId ?? null,
    title: row.title,
    description: row.description ?? null,
    status: row.status,
    priority: row.priority ?? null,
    dueDate: row.dueDate?.toISOString() ?? null,
    position: row.position,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function parseDueDate(
  value: string | null | undefined
): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new DomainError("invalid", "Invalid due date");
  }
  return parsed;
}

function buildTaskUpdateFields(
  input: UpdateTaskInput,
  dueDate: Date | null | undefined,
  position: number | undefined
): Parameters<typeof tasksRepo.update>[2] {
  return {
    ...(input.title === undefined ? {} : { title: input.title.trim() }),
    ...(input.description === undefined
      ? {}
      : { description: trimmedOrNull(input.description) }),
    ...(input.status === undefined ? {} : { status: input.status }),
    ...(input.priority === undefined ? {} : { priority: input.priority }),
    ...(dueDate === undefined ? {} : { dueDate }),
    ...(input.entityId === undefined ? {} : { entityId: input.entityId }),
    ...(position === undefined ? {} : { position }),
  };
}

async function logTaskStatusChange(
  tx: DbExec,
  input: UpdateTaskInput,
  existing: TaskRow,
  row: TaskRow
): Promise<void> {
  await activityEventsRepo.create(tx, {
    caseId: input.caseId,
    kind: "task",
    action: "status_changed",
    subjectId: row.id,
    label: row.title,
    fromValue: existing.status,
    toValue: row.status,
  });
}

export async function listTasksForCase(
  caseId: string,
  opts?: ListTasksOpts
): Promise<TaskRecord[]> {
  await assertCaseExists(caseId);
  const rows = await tasksRepo.listForCase(db, caseId, opts);
  return rows.map(toRecord);
}

export async function getTaskInCase(
  caseId: string,
  taskId: string
): Promise<TaskRecord | null> {
  const row = await tasksRepo.getInCase(db, caseId, taskId);
  return row ? toRecord(row) : null;
}

export async function createTask(input: CreateTaskInput): Promise<TaskRecord> {
  await assertCaseExists(input.caseId);
  if (input.entityId) {
    await assertEntityInCase(input.caseId, input.entityId);
  }

  const dueDate = parseDueDate(input.dueDate);
  const status = input.status ?? "backlog";

  const created = await db.transaction(async (tx) => {
    const row = await tasksRepo.create(tx, {
      caseId: input.caseId,
      title: input.title.trim(),
      description: trimmedOrNull(input.description),
      status,
      priority: input.priority ?? null,
      dueDate: dueDate === undefined ? null : dueDate,
      entityId: input.entityId ?? null,
    });
    if (!row) throw new DomainError("invalid", "Failed to create Task");
    await activityEventsRepo.create(tx, {
      caseId: input.caseId,
      kind: "task",
      action: "created",
      subjectId: row.id,
      label: row.title,
      toValue: row.status,
    });
    return row;
  });

  notifyTaskChanged(input.caseId, input.entityId ?? undefined);
  return toRecord(created);
}

export async function updateTask(input: UpdateTaskInput): Promise<TaskRecord> {
  const existing = await tasksRepo.getInCase(db, input.caseId, input.taskId);
  if (!existing) throw new DomainError("not_found", "Task not found");

  if (input.entityId) {
    await assertEntityInCase(input.caseId, input.entityId);
  }

  const dueDate = parseDueDate(input.dueDate);
  const statusChanged =
    input.status !== undefined && input.status !== existing.status;

  const updated = await db.transaction(async (tx) => {
    const destStatus = input.status;
    const position =
      statusChanged && destStatus !== undefined
        ? await tasksRepo.nextPosition(tx, input.caseId, destStatus)
        : undefined;
    const row = await tasksRepo.update(
      tx,
      input.taskId,
      buildTaskUpdateFields(input, dueDate, position)
    );
    if (!row) throw new DomainError("invalid", "Failed to update Task");

    if (statusChanged) {
      await logTaskStatusChange(tx, input, existing, row);
    }

    return row;
  });

  notifyTaskChanged(
    input.caseId,
    updated.entityId ?? existing.entityId ?? undefined
  );
  return toRecord(updated);
}

export async function deleteTask(
  caseId: string,
  taskId: string
): Promise<void> {
  const existing = await tasksRepo.getInCase(db, caseId, taskId);
  if (!existing) throw new DomainError("not_found", "Task not found");

  await db.transaction(async (tx) => {
    const ok = await tasksRepo.remove(tx, taskId);
    if (!ok) throw new DomainError("invalid", "Failed to delete Task");
    await activityEventsRepo.create(tx, {
      caseId,
      kind: "task",
      action: "deleted",
      subjectId: existing.id,
      label: existing.title,
      fromValue: existing.status,
    });
  });

  notifyTaskChanged(caseId, existing.entityId ?? undefined);
}

export interface ReorderTasksInput {
  caseId: string;
  status: TaskStatus;
  orderedIds: string[];
}

export async function reorderTasks(
  input: ReorderTasksInput
): Promise<TaskRecord[]> {
  await assertCaseExists(input.caseId);

  const records = await db.transaction(async (tx) => {
    const rows = await tasksRepo.listForCase(tx, input.caseId, {
      status: input.status,
    });
    const existing = new Set(rows.map((row) => row.id));
    if (input.orderedIds.length !== existing.size) {
      throw new DomainError("invalid", "Task order does not match the column");
    }
    const seen = new Set<string>();
    for (const id of input.orderedIds) {
      if (!existing.has(id) || seen.has(id)) {
        throw new DomainError(
          "invalid",
          "Task order does not match the column"
        );
      }
      seen.add(id);
    }
    await tasksRepo.rewriteOrder(
      tx,
      input.caseId,
      input.status,
      input.orderedIds
    );
    const next = await tasksRepo.listForCase(tx, input.caseId, {
      status: input.status,
    });
    return next.map(toRecord);
  });

  notifyTaskChanged(input.caseId);
  return records;
}
