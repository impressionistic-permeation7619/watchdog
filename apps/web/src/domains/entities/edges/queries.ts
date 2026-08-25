import { queryOptions } from "@tanstack/react-query";

import {
  listEdgesFn,
  listEdgesForCaseFn,
} from "@/domains/entities/edges/edges.functions";
import { GC_DEFAULT, STALE_DEFAULT } from "@/shared/lib/query-stale";

export const edgesKeys = {
  prefix: (caseId: string) => ["edges", caseId] as const,
  all: (caseId: string, entityId: string) =>
    ["edges", caseId, entityId] as const,
  forCase: (caseId: string) => ["edges", caseId, "case"] as const,
};

export const edgesListQuery = (caseId: string, entityId: string) =>
  queryOptions({
    queryKey: edgesKeys.all(caseId, entityId),
    queryFn: async () => listEdgesFn({ data: { caseId, entityId } }),
    staleTime: STALE_DEFAULT,
    gcTime: GC_DEFAULT,
  });

export const edgesForCaseQuery = (caseId: string) =>
  queryOptions({
    queryKey: edgesKeys.forCase(caseId),
    queryFn: async () => listEdgesForCaseFn({ data: { caseId } }),
    staleTime: STALE_DEFAULT,
    gcTime: GC_DEFAULT,
  });
