import { z } from "zod";

import {
  createClaim,
  listClaimsForEntity,
  retractClaim,
  updateClaim,
} from "@watchdog/core";
import {
  claimClassSchema,
  confidenceTierSchema,
  retractKindSchema,
} from "@watchdog/schemas";

import { withDomainError } from "../map-domain-error";
import { graphChildWrite, authed } from "../os";
import { claimSchema, userOverrideSchema } from "../schemas";

export const list = authed
  .route({
    method: "GET",
    path: "/cases/{caseId}/entities/{entityId}/claims",
    summary: "List claims for an entity",
    tags: ["claims"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      entityId: z.uuid(),
      includeRetracted: z.boolean().optional().default(false),
    })
  )
  .output(z.array(claimSchema))
  .handler(
    withDomainError(async ({ input }) =>
      listClaimsForEntity(input.caseId, input.entityId, {
        includeRetracted: input.includeRetracted,
      })
    )
  );

export const create = graphChildWrite
  .route({
    method: "POST",
    path: "/cases/{caseId}/entities/{entityId}/claims",
    summary: "Create a claim",
    tags: ["claims"],
    successStatus: 201,
  })
  .input(
    z.object({
      caseId: z.uuid(),
      entityId: z.uuid(),
      text: z.string().min(1),
      confidence: confidenceTierSchema,
      class: claimClassSchema.default("observation"),
      evidenceIds: z.array(z.uuid()).optional(),
      userOverride: userOverrideSchema,
    })
  )
  .output(claimSchema)
  .handler(withDomainError(async ({ input }) => createClaim(input)));

export const update = graphChildWrite
  .route({
    method: "PATCH",
    path: "/cases/{caseId}/claims/{claimId}",
    summary: "Update a claim",
    tags: ["claims"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      claimId: z.uuid(),
      text: z.string().min(1).optional(),
      class: claimClassSchema.optional(),
      confidence: confidenceTierSchema.optional(),
      evidenceIds: z.array(z.uuid()).optional(),
      userOverride: userOverrideSchema,
    })
  )
  .output(claimSchema)
  .handler(withDomainError(async ({ input }) => updateClaim(input)));

export const retract = graphChildWrite
  .route({
    method: "POST",
    path: "/cases/{caseId}/claims/{claimId}/retract",
    summary: "Retract a claim",
    tags: ["claims"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      claimId: z.uuid(),
      kind: retractKindSchema,
      reason: z.string().min(1),
      userOverride: userOverrideSchema,
    })
  )
  .output(claimSchema)
  .handler(
    withDomainError(async ({ input, context }) =>
      retractClaim(input, context.actor.userId)
    )
  );
