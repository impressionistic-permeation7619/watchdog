import { z } from "zod";

import { taskPrioritySchema, taskStatusSchema } from "./enums";
import { nonEmptyTrimmed, uuidSchema } from "./primitives";

export const taskSchema = z.object({
  id: uuidSchema,
  caseId: uuidSchema,
  entityId: uuidSchema.nullable(),
  title: z.string(),
  description: z.string().nullable(),
  status: taskStatusSchema,
  priority: taskPrioritySchema.nullable(),
  dueDate: z.string().nullable(),
  position: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const taskFiltersSchema = z.object({
  caseId: uuidSchema,
  entityId: uuidSchema.optional(),
  status: taskStatusSchema.optional(),
  unattachedOnly: z.boolean().optional(),
});
export type TaskFiltersInput = z.output<typeof taskFiltersSchema>;

export const taskCreateInputSchema = z.object({
  caseId: uuidSchema,
  title: nonEmptyTrimmed,
  description: z.string().optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.nullable().optional(),
  dueDate: z.string().nullable().optional(),
  entityId: uuidSchema.nullable().optional(),
});
export type CreateTaskInput = z.output<typeof taskCreateInputSchema>;

export const taskUpdateInputSchema = z
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
    { message: "At least one field is required" }
  );
export type UpdateTaskInput = z.output<typeof taskUpdateInputSchema>;

export const taskDeleteInputSchema = z.object({
  caseId: uuidSchema,
  taskId: uuidSchema,
});
export type DeleteTaskInput = z.output<typeof taskDeleteInputSchema>;

export const taskIdInputSchema = z.object({
  caseId: uuidSchema,
  taskId: uuidSchema,
});

export const taskReorderInputSchema = z.object({
  caseId: uuidSchema,
  status: taskStatusSchema,
  orderedIds: z.array(uuidSchema),
});
export type ReorderTasksInput = z.output<typeof taskReorderInputSchema>;
