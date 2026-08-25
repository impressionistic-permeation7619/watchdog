import { z } from "zod";

import {
  createIdentifier,
  listIdentifiersForCase,
  listIdentifiersForEntity,
  updateIdentifier,
} from "@watchdog/core";
import {
  confidenceTierSchema,
  identifierStatusSchema,
  identifierTypeSchema,
} from "@watchdog/schemas";

import { mapDomainError } from "../map-domain-error";
import { authed } from "../os";
import { caseIdentifierSchema, identifierSchema } from "../schemas";

export const list = authed
  .route({
    method: "GET",
    path: "/cases/{caseId}/entities/{entityId}/identifiers",
    summary: "List identifiers for an entity",
    tags: ["identifiers"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      entityId: z.uuid(),
    })
  )
  .output(z.array(identifierSchema))
  .handler(async ({ input }) =>
    mapDomainError(async () =>
      listIdentifiersForEntity(input.caseId, input.entityId)
    )
  );

export const listForCase = authed
  .route({
    method: "GET",
    path: "/cases/{caseId}/identifiers",
    summary: "List all identifiers in a case",
    tags: ["identifiers"],
  })
  .input(z.object({ caseId: z.uuid() }))
  .output(z.array(caseIdentifierSchema))
  .handler(async ({ input }) =>
    mapDomainError(async () => listIdentifiersForCase(input.caseId))
  );

export const create = authed
  .route({
    method: "POST",
    path: "/cases/{caseId}/entities/{entityId}/identifiers",
    summary: "Create an identifier",
    tags: ["identifiers"],
    successStatus: 201,
  })
  .input(
    z.object({
      caseId: z.uuid(),
      entityId: z.uuid(),
      type: identifierTypeSchema,
      value: z.string().min(1),
      confidence: confidenceTierSchema,
      platform: z.string().optional(),
      status: identifierStatusSchema.default("unknown"),
      notes: z.string().optional(),
      evidenceIds: z.array(z.uuid()).optional(),
    })
  )
  .output(identifierSchema)
  .handler(async ({ input }) =>
    mapDomainError(async () => createIdentifier(input))
  );

export const update = authed
  .route({
    method: "PATCH",
    path: "/cases/{caseId}/identifiers/{identifierId}",
    summary: "Update an identifier",
    tags: ["identifiers"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      identifierId: z.uuid(),
      value: z.string().optional(),
      platform: z.string().optional(),
      type: identifierTypeSchema.optional(),
      status: identifierStatusSchema.optional(),
      confidence: confidenceTierSchema.optional(),
      notes: z.string().optional(),
      evidenceIds: z.array(z.uuid()).optional(),
    })
  )
  .output(identifierSchema)
  .handler(async ({ input }) =>
    mapDomainError(async () => updateIdentifier(input))
  );
