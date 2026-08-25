import { queryOptions } from "@tanstack/react-query";

import {
  getArtifactContentFn,
  getJobFn,
  listCapabilitiesFn,
  listJobsFn,
  listPlaybooksFn,
} from "@/domains/jobs/jobs.functions";
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
  artifact: (uri: string, mime: string) => ["artifact", uri, mime] as const,
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

export const artifactContentQuery = (uri: string, mime: string) =>
  queryOptions({
    queryKey: jobsKeys.artifact(uri, mime),
    queryFn: async () => getArtifactContentFn({ data: { uri, mime } }),
    staleTime: STALE_DEFAULT,
    gcTime: GC_DEFAULT,
    enabled: uri.length > 0,
    meta: { silentError: true },
  });
