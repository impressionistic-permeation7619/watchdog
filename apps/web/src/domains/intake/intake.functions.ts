import { createServerFn } from "@tanstack/react-start";

import {
  attachEvidenceEntityInputSchema,
  confirmFileUploadInputSchema,
  dumpPasteInputSchema,
  dumpUrlInputSchema,
  evidenceScopeInputSchema,
  listEvidenceInputSchema,
  presignUploadInputSchema,
  processEvidenceInputSchema,
  type EvidenceRecord,
  type PresignedUpload,
} from "@/domains/intake/types";
import { actorFromSession, orpcForActor } from "@/lib/orpc.server";

export const getEvidenceDownloadUrlFn = createServerFn({ method: "GET" })
  .validator(evidenceScopeInputSchema)
  .handler(
    async ({ data, context }): Promise<{ url: string | null }> =>
      orpcForActor(actorFromSession(context.session)).evidence.downloadUrl({
        caseId: data.caseId,
        evidenceId: data.evidenceId,
      })
  );

export const listEvidenceFn = createServerFn({ method: "GET" })
  .validator(listEvidenceInputSchema)
  .handler(
    async ({ data, context }): Promise<EvidenceRecord[]> =>
      orpcForActor(actorFromSession(context.session)).evidence.list({
        caseId: data.caseId,
        unprocessedOnly: data.unprocessedOnly,
        unattachedOnly: data.unattachedOnly,
        hiddenOnly: data.hiddenOnly,
      })
  );

export const processEvidenceFn = createServerFn({ method: "POST" })
  .validator(processEvidenceInputSchema)
  .handler(async ({ data, context }) =>
    orpcForActor(actorFromSession(context.session)).evidence.process({
      caseId: data.caseId,
      evidenceId: data.evidenceId,
      ai: data.ai,
    })
  );

export const enrichUrlEvidenceFn = createServerFn({ method: "POST" })
  .validator(evidenceScopeInputSchema)
  .handler(async ({ data, context }) =>
    orpcForActor(actorFromSession(context.session)).evidence.enrich({
      caseId: data.caseId,
      evidenceId: data.evidenceId,
    })
  );

export const dumpPasteFn = createServerFn({ method: "POST" })
  .validator(dumpPasteInputSchema)
  .handler(
    async ({ data, context }): Promise<EvidenceRecord> =>
      orpcForActor(actorFromSession(context.session)).evidence.createPaste(data)
  );

export const dumpUrlFn = createServerFn({ method: "POST" })
  .validator(dumpUrlInputSchema)
  .handler(
    async ({ data, context }): Promise<EvidenceRecord> =>
      orpcForActor(actorFromSession(context.session)).evidence.createUrl(data)
  );

export const softDeleteEvidenceFn = createServerFn({ method: "POST" })
  .validator(evidenceScopeInputSchema)
  .handler(
    async ({ data, context }): Promise<{ ok: true }> =>
      orpcForActor(actorFromSession(context.session)).evidence.softDelete(data)
  );

export const restoreEvidenceFn = createServerFn({ method: "POST" })
  .validator(evidenceScopeInputSchema)
  .handler(
    async ({ data, context }): Promise<{ ok: true }> =>
      orpcForActor(actorFromSession(context.session)).evidence.restore(data)
  );

export const attachEvidenceEntityFn = createServerFn({ method: "POST" })
  .validator(attachEvidenceEntityInputSchema)
  .handler(
    async ({ data, context }): Promise<EvidenceRecord> =>
      orpcForActor(actorFromSession(context.session)).evidence.attachEntity(
        data
      )
  );

export const presignUploadFn = createServerFn({ method: "POST" })
  .validator(presignUploadInputSchema)
  .handler(
    async ({ data, context }): Promise<PresignedUpload> =>
      orpcForActor(actorFromSession(context.session)).evidence.presign(data)
  );

export const confirmFileUploadFn = createServerFn({ method: "POST" })
  .validator(confirmFileUploadInputSchema)
  .handler(
    async ({ data, context }): Promise<EvidenceRecord> =>
      orpcForActor(actorFromSession(context.session)).evidence.confirmFile(data)
  );
