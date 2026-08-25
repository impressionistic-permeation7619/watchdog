import { createServerFn } from "@tanstack/react-start";

import {
  cancelJobInputSchema,
  cancelPlaybookInputSchema,
  getArtifactContentInputSchema,
  getJobInputSchema,
  listJobsInputSchema,
  startJobInputSchema,
  startPlaybookInputSchema,
  type CapListItem,
  type PlaybookListItem,
} from "@/domains/jobs/types";
import { actorFromSession, orpcForActor } from "@/lib/orpc.server";
import { readArtifactBytes } from "@watchdog/core";
import type { JobListRecord, JobRecord } from "@watchdog/core";

export type { CapListItem, PlaybookListItem } from "@/domains/jobs/types";
export type { JobListRecord, JobRecord } from "@watchdog/core";

export const listCapabilitiesFn = createServerFn({ method: "GET" }).handler(
  async ({ context }): Promise<CapListItem[]> =>
    orpcForActor(actorFromSession(context.session)).capabilities.list()
);

export const listPlaybooksFn = createServerFn({ method: "GET" }).handler(
  async ({ context }): Promise<PlaybookListItem[]> =>
    orpcForActor(
      actorFromSession(context.session)
    ).capabilities.listPlaybooks() as Promise<PlaybookListItem[]>
);

export const listJobsFn = createServerFn({ method: "GET" })
  .validator(listJobsInputSchema)
  .handler(
    async ({ data, context }): Promise<JobListRecord[]> =>
      orpcForActor(actorFromSession(context.session)).jobs.listForCase({
        caseId: data.caseId,
      })
  );

export const getJobFn = createServerFn({ method: "GET" })
  .validator(getJobInputSchema)
  .handler(
    async ({ data, context }): Promise<JobRecord> =>
      orpcForActor(actorFromSession(context.session)).jobs.get({
        caseId: data.caseId,
        jobId: data.jobId,
      })
  );

export const startJobFn = createServerFn({ method: "POST" })
  .validator(startJobInputSchema)
  .handler(
    async ({ data, context }): Promise<JobRecord> =>
      orpcForActor(actorFromSession(context.session)).jobs.start(data)
  );

export const cancelJobFn = createServerFn({ method: "POST" })
  .validator(cancelJobInputSchema)
  .handler(
    async ({ data, context }): Promise<JobRecord> =>
      orpcForActor(actorFromSession(context.session)).jobs.cancel(data)
  );

export const startPlaybookFn = createServerFn({ method: "POST" })
  .validator(startPlaybookInputSchema)
  .handler(async ({ data, context }) =>
    orpcForActor(actorFromSession(context.session)).jobs.startPlaybook(data)
  );

export const cancelPlaybookFn = createServerFn({ method: "POST" })
  .validator(cancelPlaybookInputSchema)
  .handler(async ({ data, context }) =>
    orpcForActor(actorFromSession(context.session)).jobs.cancelPlaybook(data)
  );

/**
 * Fetch artifact content from MinIO for display in the job Detail.
 * Returns text content for JSON/text artifacts, null for binary.
 */
export const getArtifactContentFn = createServerFn({ method: "POST" })
  .validator(getArtifactContentInputSchema)
  .handler(async ({ data }): Promise<{ text: string | null }> => {
    const isText =
      data.mime.startsWith("text/") ||
      data.mime.includes("json") ||
      data.mime.includes("xml") ||
      data.mime.includes("javascript");

    if (!isText) return { text: null };

    const bytes = await readArtifactBytes(data.uri);
    const text = new TextDecoder().decode(bytes);
    // Truncate very large artifacts
    return {
      text:
        text.length > 50_000 ? `${text.slice(0, 50_000)}\n…(truncated)` : text,
    };
  });
