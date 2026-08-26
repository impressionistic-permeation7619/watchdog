import { queryOptions } from "@tanstack/react-query";
import type { QueryClient } from "@tanstack/react-query";

import {
  getArtifactContentFn,
  getJobFn,
  listCapabilitiesFn,
  listJobsFn,
  listPlaybooksFn,
} from "@/domains/jobs/jobs.functions";
import type { GetArtifactContentInput } from "@/domains/jobs/types";
import { invalidateAfterJobMutation } from "@/shared/lib/query-invalidation";
import {
  GC_DEFAULT,
  GC_REALTIME,
  GC_STABLE,
  STALE_DEFAULT,
  STALE_REALTIME,
  STALE_STABLE,
} from "@/shared/lib/query-stale";

export const jobsKeys = {
  all: (caseId: string) => ["jobs", caseId] as const,
  detail: (caseId: string, jobId: string) =>
    ["jobs", caseId, "detail", jobId] as const,
  jobArtifact: (
    caseId: string,
    jobId: string,
    sha256: string,
    mime: string
  ) => ["artifact", "job", caseId, jobId, sha256, mime] as const,
  evidenceArtifact: (caseId: string, evidenceId: string, mime: string) =>
    ["artifact", "evidence", caseId, evidenceId, mime] as const,
};

const capabilitiesKeys = {
  all: ["capabilities"] as const,
};

const playbooksKeys = {
  all: ["playbooks"] as const,
};

export const jobsListQuery = (caseId: string) =>
  queryOptions({
    queryKey: jobsKeys.all(caseId),
    queryFn: async () => listJobsFn({ data: { caseId } }),
    staleTime: STALE_REALTIME,
    gcTime: GC_REALTIME,
  });

export const jobDetailQuery = (caseId: string, jobId: string) =>
  queryOptions({
    queryKey: jobsKeys.detail(caseId, jobId),
    queryFn: async () => getJobFn({ data: { caseId, jobId } }),
    staleTime: STALE_REALTIME,
    gcTime: GC_REALTIME,
  });

export const capabilitiesListQuery = () =>
  queryOptions({
    queryKey: capabilitiesKeys.all,
    queryFn: async () => listCapabilitiesFn(),
    staleTime: STALE_STABLE,
    gcTime: GC_STABLE,
  });

export const playbooksListQuery = () =>
  queryOptions({
    queryKey: playbooksKeys.all,
    queryFn: async () => listPlaybooksFn(),
    staleTime: STALE_STABLE,
    gcTime: GC_STABLE,
  });

export function artifactContentQuery(input: GetArtifactContentInput) {
  const queryKey =
    input.source === "job"
      ? jobsKeys.jobArtifact(
          input.caseId,
          input.jobId,
          input.sha256,
          input.mime
        )
      : jobsKeys.evidenceArtifact(
          input.caseId,
          input.evidenceId,
          input.mime
        );

  const enabled =
    input.source === "job"
      ? input.sha256.length > 0
      : input.evidenceId.length > 0;

  return queryOptions({
    queryKey,
    queryFn: async () => getArtifactContentFn({ data: input }),
    staleTime: STALE_DEFAULT,
    gcTime: GC_DEFAULT,
    enabled,
    meta: { silentError: true },
  });
}

/** Jobs workspace freshness — SSE `job_update` is the follow-up path; no timed retries. */
export async function refreshJobsAfterMutation(
  queryClient: QueryClient,
  caseId: string
): Promise<void> {
  await invalidateAfterJobMutation(queryClient, caseId);
}
