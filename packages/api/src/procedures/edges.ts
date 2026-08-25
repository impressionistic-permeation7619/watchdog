import { z } from "zod";

import {
  createEdge,
  deleteEdge,
  listEdgesForCase,
  listEdgesForEntity,
  updateEdge,
} from "@watchdog/core";
import { confidenceTierSchema, edgePredicateSchema } from "@watchdog/schemas";

import { mapDomainError } from "../map-domain-error";
import { authed } from "../os";
import { caseEdgeSchema, edgeSchema } from "../schemas";

export const list = authed
  .route({
    method: "GET",
    path: "/cases/{caseId}/entities/{entityId}/edges",
    summary: "List edges for an entity",
    tags: ["edges"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      entityId: z.uuid(),
    })
  )
  .output(z.array(edgeSchema))
  .handler(async ({ input }) =>
    mapDomainError(async () => listEdgesForEntity(input.caseId, input.entityId))
  );

export const listForCase = authed
  .route({
    method: "GET",
    path: "/cases/{caseId}/edges",
    summary: "List all edges in a case",
    tags: ["edges"],
  })
  .input(z.object({ caseId: z.uuid() }))
  .output(z.array(caseEdgeSchema))
  .handler(async ({ input }) =>
    mapDomainError(async () => listEdgesForCase(input.caseId))
  );

export const create = authed
  .route({
    method: "POST",
    path: "/cases/{caseId}/edges",
    summary: "Create an edge",
    tags: ["edges"],
    successStatus: 201,
  })
  .input(
    z.object({
      caseId: z.uuid(),
      fromId: z.uuid(),
      toId: z.uuid(),
      predicate: edgePredicateSchema,
      confidence: confidenceTierSchema,
      notes: z.string().optional(),
      evidenceIds: z.array(z.uuid()).optional(),
      viewEntityId: z.uuid().optional(),
    })
  )
  .output(edgeSchema)
  .handler(async ({ input }) => mapDomainError(async () => createEdge(input)));

export const update = authed
  .route({
    method: "PATCH",
    path: "/cases/{caseId}/edges/{edgeId}",
    summary:
      "Update an edge (endpoints, predicate, notes, confidence, evidence)",
    tags: ["edges"],
  })
  .input(
    z
      .object({
        caseId: z.uuid(),
        edgeId: z.uuid(),
        entityId: z.uuid(),
        fromId: z.uuid().optional(),
        toId: z.uuid().optional(),
        predicate: edgePredicateSchema.optional(),
        confidence: confidenceTierSchema.optional(),
        notes: z.string().optional(),
        evidenceIds: z.array(z.uuid()).optional(),
      })
      .refine(
        (v) =>
          (v.fromId === undefined && v.toId === undefined) ||
          (v.fromId !== undefined && v.toId !== undefined),
        { message: "fromId and toId must be sent together" }
      )
  )
  .output(edgeSchema)
  .handler(async ({ input }) => mapDomainError(async () => updateEdge(input)));

export const remove = authed
  .route({
    method: "DELETE",
    path: "/cases/{caseId}/edges/{edgeId}",
    summary: "Delete an edge",
    tags: ["edges"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      edgeId: z.uuid(),
    })
  )
  .output(z.void())
  .handler(async ({ input }) =>
    mapDomainError(async () => deleteEdge(input.caseId, input.edgeId))
  );
