import { createServerFn } from "@tanstack/react-start";

import {
  createTaskInputSchema,
  deleteTaskInputSchema,
  reorderTasksInputSchema,
  taskFiltersSchema,
  taskIdInputSchema,
  updateTaskInputSchema,
  type TaskRecord,
} from "@/domains/tasks/types";
import {
  actorFromSession,
  orpcForActor,
  orpcNullIfNotFound,
} from "@/lib/orpc.server";

export const listTasksFn = createServerFn({ method: "GET" })
  .validator(taskFiltersSchema)
  .handler(
    async ({ data, context }): Promise<TaskRecord[]> =>
      orpcForActor(actorFromSession(context.session)).tasks.list(data)
  );

export const getTaskFn = createServerFn({ method: "GET" })
  .validator(taskIdInputSchema)
  .handler(
    async ({ data, context }): Promise<TaskRecord | null> =>
      orpcNullIfNotFound(
        orpcForActor(actorFromSession(context.session)).tasks.get(data)
      )
  );

export const createTaskFn = createServerFn({ method: "POST" })
  .validator(createTaskInputSchema)
  .handler(
    async ({ data, context }): Promise<TaskRecord> =>
      orpcForActor(actorFromSession(context.session)).tasks.create(data)
  );

export const updateTaskFn = createServerFn({ method: "POST" })
  .validator(updateTaskInputSchema)
  .handler(
    async ({ data, context }): Promise<TaskRecord> =>
      orpcForActor(actorFromSession(context.session)).tasks.update(data)
  );

export const deleteTaskFn = createServerFn({ method: "POST" })
  .validator(deleteTaskInputSchema)
  .handler(
    async ({ data, context }): Promise<{ ok: true }> =>
      orpcForActor(actorFromSession(context.session)).tasks.remove(data)
  );

export const reorderTasksFn = createServerFn({ method: "POST" })
  .validator(reorderTasksInputSchema)
  .handler(
    async ({ data, context }): Promise<TaskRecord[]> =>
      orpcForActor(actorFromSession(context.session)).tasks.reorder(data)
  );
