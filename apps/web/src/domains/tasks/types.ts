import { z } from "zod";

import {
  nonEmptyTrimmed,
  taskPrioritySchema,
  taskStatusSchema,
  uuidSchema,
  type EntityKind,
  type TaskPriority,
  type TaskStatus,
} from "@watchdog/schemas";

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

export interface TaskEntityLabel {
  id: string;
  name: string;
  kind: EntityKind;
}

export const taskFiltersSchema = z.object({
  caseId: uuidSchema,
  entityId: uuidSchema.optional(),
  status: taskStatusSchema.optional(),
  unattachedOnly: z.boolean().optional(),
});
export type TaskFiltersInput = z.output<typeof taskFiltersSchema>;

export const createTaskInputSchema = z.object({
  caseId: uuidSchema,
  title: nonEmptyTrimmed,
  description: z.string().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.nullable().optional(),
  dueDate: z.string().nullable().optional(),
  entityId: uuidSchema.nullable().optional(),
});
export type CreateTaskInput = z.output<typeof createTaskInputSchema>;

export const updateTaskInputSchema = z
  .object({
    caseId: uuidSchema,
    taskId: uuidSchema,
    title: nonEmptyTrimmed.optional(),
    description: z.string().nullable().optional(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.nullable().optional(),
    dueDate: z.string().nullable().optional(),
    entityId: uuidSchema.nullable().optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.status !== undefined ||
      data.priority !== undefined ||
      data.dueDate !== undefined ||
      data.entityId !== undefined,
    { message: "Nothing to update" }
  );
export type UpdateTaskInput = z.output<typeof updateTaskInputSchema>;

export const deleteTaskInputSchema = z.object({
  caseId: uuidSchema,
  taskId: uuidSchema,
});
export type DeleteTaskInput = z.output<typeof deleteTaskInputSchema>;

export const taskIdInputSchema = z.object({
  caseId: uuidSchema,
  taskId: uuidSchema,
});

export const reorderTasksInputSchema = z.object({
  caseId: uuidSchema,
  status: taskStatusSchema,
  orderedIds: z.array(uuidSchema),
});
export type ReorderTasksInput = z.output<typeof reorderTasksInputSchema>;
