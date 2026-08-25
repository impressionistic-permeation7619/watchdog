import { createServerFn } from "@tanstack/react-start";

import {
  caseIdInputSchema,
  caseSlugInputSchema,
  createEntityInputSchema,
  updateEntityFieldsInputSchema,
  type EntityRecord,
} from "@/domains/entities/types";
import {
  actorFromSession,
  orpcForActor,
  orpcNullIfNotFound,
} from "@/lib/orpc.server";

export const listEntitiesFn = createServerFn({ method: "GET" })
  .validator(caseIdInputSchema)
  .handler(
    async ({ data, context }): Promise<EntityRecord[]> =>
      orpcForActor(actorFromSession(context.session)).entities.list({
        caseId: data.caseId,
      })
  );

export const getEntityBySlugFn = createServerFn({ method: "GET" })
  .validator(caseSlugInputSchema)
  .handler(
    async ({ data, context }): Promise<EntityRecord | null> =>
      orpcNullIfNotFound(
        orpcForActor(actorFromSession(context.session)).entities.get({
          caseId: data.caseId,
          slug: data.slug,
        })
      )
  );

export const createEntityFn = createServerFn({ method: "POST" })
  .validator(createEntityInputSchema)
  .handler(
    async ({ data, context }): Promise<EntityRecord> =>
      orpcForActor(actorFromSession(context.session)).entities.create(data)
  );

export const updateEntityFieldsFn = createServerFn({ method: "POST" })
  .validator(updateEntityFieldsInputSchema)
  .handler(
    async ({ data, context }): Promise<EntityRecord> =>
      orpcForActor(actorFromSession(context.session)).entities.update(data)
  );
