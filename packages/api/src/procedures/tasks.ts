import { ORPCError } from "@orpc/server";
import { z } from "zod";

import {
  createTask,
  deleteTask,
  getTaskInCase,
  listTasksForCase,
  reorderTasks,
  updateTask,
} from "@watchdog/core";
import { taskPrioritySchema, taskStatusSchema } from "@watchdog/schemas";

import { mapDomainError } from "../map-domain-error";
import { authed } from "../os";
import { taskSchema } from "../schemas";

export const list = authed
  .route({
    method: "GET",
    path: "/cases/{caseId}/tasks",
    summary: "List tasks for a case",
    tags: ["tasks"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      entityId: z.uuid().optional(),
      status: taskStatusSchema.optional(),
      unattachedOnly: z.boolean().optional(),
    })
  )
  .output(z.array(taskSchema))
  .handler(async ({ input }) =>
    mapDomainError(async () =>
      listTasksForCase(input.caseId, {
        entityId: input.entityId,
        status: input.status,
        unattachedOnly: input.unattachedOnly,
      })
    )
  );

export const get = authed
  .route({
    method: "GET",
    path: "/cases/{caseId}/tasks/{taskId}",
    summary: "Get a task by id",
    tags: ["tasks"],
  })
  .input(z.object({ caseId: z.uuid(), taskId: z.uuid() }))
  .output(taskSchema)
  .handler(async ({ input }) => {
    const row = await mapDomainError(async () =>
      getTaskInCase(input.caseId, input.taskId)
    );
    if (!row) throw new ORPCError("NOT_FOUND", { message: "Task not found" });
    return row;
  });

export const create = authed
  .route({
    method: "POST",
    path: "/cases/{caseId}/tasks",
    summary: "Create a task",
    tags: ["tasks"],
    successStatus: 201,
  })
  .input(
    z.object({
      caseId: z.uuid(),
      title: z.string().trim().min(1),
      description: z.string().optional(),
      status: taskStatusSchema.optional(),
      priority: taskPrioritySchema.nullable().optional(),
      dueDate: z.string().nullable().optional(),
      entityId: z.uuid().nullable().optional(),
    })
  )
  .output(taskSchema)
  .handler(async ({ input }) => mapDomainError(async () => createTask(input)));

export const update = authed
  .route({
    method: "PATCH",
    path: "/cases/{caseId}/tasks/{taskId}",
    summary: "Update a task",
    tags: ["tasks"],
  })
  .input(
    z
      .object({
        caseId: z.uuid(),
        taskId: z.uuid(),
        title: z.string().trim().min(1).optional(),
        description: z.string().nullable().optional(),
        status: taskStatusSchema.optional(),
        priority: taskPrioritySchema.nullable().optional(),
        dueDate: z.string().nullable().optional(),
        entityId: z.uuid().nullable().optional(),
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
      )
  )
  .output(taskSchema)
  .handler(async ({ input }) => mapDomainError(async () => updateTask(input)));

export const remove = authed
  .route({
    method: "DELETE",
    path: "/cases/{caseId}/tasks/{taskId}",
    summary: "Delete a task",
    tags: ["tasks"],
  })
  .input(z.object({ caseId: z.uuid(), taskId: z.uuid() }))
  .output(z.object({ ok: z.literal(true) }))
  .handler(async ({ input }) =>
    mapDomainError(async () => {
      await deleteTask(input.caseId, input.taskId);
      return { ok: true as const };
    })
  );

export const reorder = authed
  .route({
    method: "POST",
    path: "/cases/{caseId}/tasks/reorder",
    summary: "Rewrite task order within a status column",
    tags: ["tasks"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      status: taskStatusSchema,
      orderedIds: z.array(z.uuid()),
    })
  )
  .output(z.array(taskSchema))
  .handler(async ({ input }) =>
    mapDomainError(async () => reorderTasks(input))
  );
