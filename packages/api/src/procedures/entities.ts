import { ORPCError } from "@orpc/server";
import { z } from "zod";

import {
  createEntity,
  getEntityByCaseSlug,
  listEntitiesForCase,
  updateEntityFields,
} from "@watchdog/core";
import { entityKindSchema } from "@watchdog/schemas";

import { withDomainError } from "../map-domain-error";
import { authed } from "../os";
import { entitySchema } from "../schemas";

export const list = authed
  .route({
    method: "GET",
    path: "/cases/{caseId}/entities",
    summary: "List entities for a case",
    tags: ["entities"],
  })
  .input(z.object({ caseId: z.uuid() }))
  .output(z.array(entitySchema))
  .handler(
    withDomainError(async ({ input }) => listEntitiesForCase(input.caseId))
  );

export const get = authed
  .route({
    method: "GET",
    path: "/cases/{caseId}/entities/{slug}",
    summary: "Get entity by slug",
    tags: ["entities"],
  })
  .input(z.object({ caseId: z.uuid(), slug: z.string().min(1) }))
  .output(entitySchema)
  .handler(
    withDomainError(async ({ input }) => {
      const row = await getEntityByCaseSlug(input.caseId, input.slug);
      if (!row)
        throw new ORPCError("NOT_FOUND", { message: "Entity not found" });
      return row;
    })
  );

export const create = authed
  .route({
    method: "POST",
    path: "/cases/{caseId}/entities",
    summary: "Create an entity",
    tags: ["entities"],
    successStatus: 201,
  })
  .input(
    z.object({
      caseId: z.uuid(),
      kind: entityKindSchema,
      name: z.string().min(1),
      slug: z.string().min(1),
    })
  )
  .output(entitySchema)
  .handler(withDomainError(async ({ input }) => createEntity(input)));

export const update = authed
  .route({
    method: "PATCH",
    path: "/cases/{caseId}/entities/{entityId}",
    summary: "Update entity kind, name, summary, or notes",
    tags: ["entities"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      entityId: z.uuid(),
      kind: entityKindSchema.optional(),
      name: z.string().trim().min(1).optional(),
      summary: z.string().optional(),
      notes: z.string().optional(),
    })
  )
  .output(entitySchema)
  .handler(withDomainError(async ({ input }) => updateEntityFields(input)));
