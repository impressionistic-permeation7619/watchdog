import { z } from "zod";

import {
  attachEvidenceEntity,
  confirmFileUpload,
  dumpPaste,
  dumpUrl,
  enrichUrlEvidence,
  getEvidenceDownloadUrl,
  listEvidenceForCase,
  presignUpload,
  processEvidence,
  restoreEvidence,
  softDeleteEvidence,
} from "@watchdog/core";

import { withDomainError } from "../map-domain-error";
import { authed } from "../os";
import { evidenceSchema, jobSchema, presignedUploadSchema } from "../schemas";

export const list = authed
  .route({
    method: "GET",
    path: "/cases/{caseId}/evidence",
    summary: "List evidence for a case",
    tags: ["evidence"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      unprocessedOnly: z.boolean().optional().default(false),
      unattachedOnly: z.boolean().optional().default(false),
      hiddenOnly: z.boolean().optional().default(false),
    })
  )
  .output(z.array(evidenceSchema))
  .handler(
    withDomainError(async ({ input }) =>
      listEvidenceForCase(input.caseId, {
        unprocessedOnly: input.unprocessedOnly,
        unattachedOnly: input.unattachedOnly,
        hiddenOnly: input.hiddenOnly,
      })
    )
  );

export const createPaste = authed
  .route({
    method: "POST",
    path: "/cases/{caseId}/evidence/paste",
    summary: "Dump paste text as evidence",
    tags: ["evidence"],
    successStatus: 201,
  })
  .input(
    z.object({
      caseId: z.uuid(),
      body: z.string().min(1),
      label: z.string().optional(),
      sourceUrl: z.url().optional(),
      entityId: z.uuid().optional(),
    })
  )
  .output(evidenceSchema)
  .handler(
    withDomainError(async ({ input, context }) =>
      dumpPaste({ ...input, actorId: context.actor.userId })
    )
  );

export const createUrl = authed
  .route({
    method: "POST",
    path: "/cases/{caseId}/evidence/url",
    summary: "Dump a URL reference as evidence",
    tags: ["evidence"],
    successStatus: 201,
  })
  .input(
    z.object({
      caseId: z.uuid(),
      sourceUrl: z.url(),
      label: z.string().optional(),
      notes: z.string().optional(),
      entityId: z.uuid().optional(),
    })
  )
  .output(evidenceSchema)
  .handler(
    withDomainError(async ({ input, context }) =>
      dumpUrl({ ...input, actorId: context.actor.userId })
    )
  );

export const softDelete = authed
  .route({
    method: "DELETE",
    path: "/cases/{caseId}/evidence/{evidenceId}",
    summary: "Soft-delete evidence",
    tags: ["evidence"],
  })
  .input(z.object({ caseId: z.uuid(), evidenceId: z.uuid() }))
  .output(z.object({ ok: z.literal(true) }))
  .handler(
    withDomainError(async ({ input }) => {
      await softDeleteEvidence(input);
      return { ok: true as const };
    })
  );

export const restore = authed
  .route({
    method: "POST",
    path: "/cases/{caseId}/evidence/{evidenceId}/restore",
    summary: "Restore soft-deleted evidence to the active queue",
    tags: ["evidence"],
  })
  .input(z.object({ caseId: z.uuid(), evidenceId: z.uuid() }))
  .output(z.object({ ok: z.literal(true) }))
  .handler(
    withDomainError(async ({ input }) => {
      await restoreEvidence(input);
      return { ok: true as const };
    })
  );

export const attachEntity = authed
  .route({
    method: "PATCH",
    path: "/cases/{caseId}/evidence/{evidenceId}",
    summary: "Attach or replace the Evidence Entity",
    tags: ["evidence"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      evidenceId: z.uuid(),
      entityId: z.uuid().nullable(),
    })
  )
  .output(evidenceSchema)
  .handler(
    withDomainError(async ({ input }) => attachEvidenceEntity(input))
  );

export const presign = authed
  .route({
    method: "POST",
    path: "/cases/{caseId}/evidence/presign",
    summary: "Presign a direct upload to object storage",
    tags: ["evidence"],
  })
  .input(
    z.object({
      caseId: z.uuid(),
      sha256: z.string().min(1),
      mime: z.string().min(1),
      byteLength: z.number().int().positive(),
      name: z.string().optional(),
    })
  )
  .output(presignedUploadSchema)
  .handler(withDomainError(async ({ input }) => presignUpload(input)));

export const confirmFile = authed
  .route({
    method: "POST",
    path: "/cases/{caseId}/evidence/file",
    summary: "Confirm a presigned file upload as evidence",
    tags: ["evidence"],
    successStatus: 201,
  })
  .input(
    z.object({
      caseId: z.uuid(),
      uri: z.string().min(1),
      sha256: z.string().min(1),
      mime: z.string().min(1),
      byteLength: z.number().int().positive(),
      label: z.string().optional(),
      entityId: z.uuid().optional(),
    })
  )
  .output(evidenceSchema)
  .handler(
    withDomainError(async ({ input, context }) =>
      confirmFileUpload(input, context.actor.userId)
    )
  );

export const downloadUrl = authed
  .route({
    method: "GET",
    path: "/cases/{caseId}/evidence/{evidenceId}/download-url",
    summary: "Get a short-lived download URL for evidence",
    tags: ["evidence"],
  })
  .input(z.object({ caseId: z.uuid(), evidenceId: z.uuid() }))
  .output(z.object({ url: z.string().nullable() }))
  .handler(
    withDomainError(async ({ input }) =>
      getEvidenceDownloadUrl(input.caseId, input.evidenceId)
    )
  );

export const process = authed
  .route({
    method: "POST",
    path: "/cases/{caseId}/evidence/{evidenceId}/process",
    summary: "Start Harvest or Extract (AI) for evidence",
    tags: ["evidence"],
    successStatus: 201,
  })
  .input(
    z.object({
      caseId: z.uuid(),
      evidenceId: z.uuid(),
      ai: z.boolean().optional().default(false),
    })
  )
  .output(jobSchema)
  .handler(
    withDomainError(async ({ input, context }) =>
      processEvidence({ ...input, actorId: context.actor.userId })
    )
  );

export const enrich = authed
  .route({
    method: "POST",
    path: "/cases/{caseId}/evidence/{evidenceId}/enrich",
    summary: "Start URL Enrich for evidence",
    tags: ["evidence"],
    successStatus: 201,
  })
  .input(z.object({ caseId: z.uuid(), evidenceId: z.uuid() }))
  .output(jobSchema)
  .handler(
    withDomainError(async ({ input, context }) =>
      enrichUrlEvidence({ ...input, actorId: context.actor.userId })
    )
  );
