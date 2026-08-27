import { z } from "zod";

import {
  acceptProposal,
  createAgentProposal,
  listProposalsForCase,
  rejectProposal,
} from "@watchdog/core";
import { patchOpSchema } from "@watchdog/schemas";

import { withDomainError } from "../map-domain-error";
import { authed } from "../os";
import {
  confidenceTierSchema,
  proposalSchema,
  proposalStatusSchema,
} from "../schemas";

export const create = authed
  .route({
    method: "POST",
    path: "/cases/{caseId}/proposals",
    summary: "Create an agent Proposal (Inbox)",
    tags: ["inbox"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      patch: z.array(patchOpSchema).min(1),
      summary: z.string().optional(),
      evidenceIds: z.array(z.uuid()).optional(),
    })
  )
  .output(proposalSchema)
  .handler(
    withDomainError(async ({ input, context }) => {
      const { proposal } = await createAgentProposal({
        caseId: input.caseId,
        actorId: context.actor.userId,
        patch: input.patch,
        summary: input.summary,
        evidenceIds: input.evidenceIds,
      });
      return proposal;
    })
  );

export const listForCase = authed
  .route({
    method: "GET",
    path: "/cases/{caseId}/proposals",
    summary: "List proposals for a case",
    tags: ["inbox"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      status: proposalStatusSchema.optional().default("pending"),
    })
  )
  .output(z.array(proposalSchema))
  .handler(
    withDomainError(async ({ input }) =>
      listProposalsForCase(input.caseId, { status: input.status })
    )
  );

export const accept = authed
  .route({
    method: "POST",
    path: "/cases/{caseId}/proposals/{proposalId}/accept",
    summary: "Accept a pending Proposal",
    tags: ["inbox"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      proposalId: z.uuid(),
      confidence: confidenceTierSchema.optional(),
      sharedEvidenceIds: z.array(z.uuid()).optional().default([]),
      attestationText: z.string().optional(),
    })
  )
  .output(proposalSchema)
  .handler(
    withDomainError(async ({ input, context }) =>
      acceptProposal({
        caseId: input.caseId,
        proposalId: input.proposalId,
        confidence: input.confidence,
        sharedEvidenceIds: input.sharedEvidenceIds,
        attestationText: input.attestationText,
        actorId: context.actor.userId,
      })
    )
  );

export const reject = authed
  .route({
    method: "POST",
    path: "/cases/{caseId}/proposals/{proposalId}/reject",
    summary: "Reject a pending Proposal",
    tags: ["inbox"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      proposalId: z.uuid(),
      reason: z.string().optional(),
    })
  )
  .output(proposalSchema)
  .handler(
    withDomainError(async ({ input, context }) =>
      rejectProposal({
        caseId: input.caseId,
        proposalId: input.proposalId,
        reason: input.reason,
        actorId: context.actor.userId,
      })
    )
  );
