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
import {
  taskCreateInputSchema,
  taskDeleteInputSchema,
  taskFiltersSchema,
  taskIdInputSchema,
  taskReorderInputSchema,
  taskUpdateInputSchema,
} from "@watchdog/schemas";

import { withDomainError } from "../map-domain-error";
import { authed } from "../os";
import { taskSchema } from "../schemas";

export const list = authed
  .route({
    method: "GET",
    path: "/cases/{caseId}/tasks",
    summary: "List tasks for a case",
    tags: ["tasks"],
  })
  .input(taskFiltersSchema)
  .output(taskSchema.array())
  .handler(
    withDomainError(async ({ input }) =>
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
  .input(taskIdInputSchema)
  .output(taskSchema)
  .handler(
    withDomainError(async ({ input }) => {
      const row = await getTaskInCase(input.caseId, input.taskId);
      if (!row) throw new ORPCError("NOT_FOUND", { message: "Task not found" });
      return row;
    })
  );

export const create = authed
  .route({
    method: "POST",
    path: "/cases/{caseId}/tasks",
    summary: "Create a task",
    tags: ["tasks"],
    successStatus: 201,
  })
  .input(taskCreateInputSchema)
  .output(taskSchema)
  .handler(withDomainError(async ({ input }) => createTask(input)));

export const update = authed
  .route({
    method: "PATCH",
    path: "/cases/{caseId}/tasks/{taskId}",
    summary: "Update a task",
    tags: ["tasks"],
  })
  .input(taskUpdateInputSchema)
  .output(taskSchema)
  .handler(withDomainError(async ({ input }) => updateTask(input)));

export const remove = authed
  .route({
    method: "DELETE",
    path: "/cases/{caseId}/tasks/{taskId}",
    summary: "Delete a task",
    tags: ["tasks"],
  })
  .input(taskDeleteInputSchema)
  .output(z.object({ ok: z.literal(true) }))
  .handler(
    withDomainError(async ({ input }) => {
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
  .input(taskReorderInputSchema)
  .output(taskSchema.array())
  .handler(withDomainError(async ({ input }) => reorderTasks(input)));
