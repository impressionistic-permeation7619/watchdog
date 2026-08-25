import { queryOptions } from "@tanstack/react-query";

import {
  getEntityBySlugFn,
  listEntitiesFn,
} from "@/domains/entities/entities.functions";
import { GC_DEFAULT, STALE_DEFAULT } from "@/shared/lib/query-stale";

export const entitiesKeys = {
  all: (caseId: string) => ["entities", caseId] as const,
  detail: (caseId: string, slug: string) => ["entity", caseId, slug] as const,
};

export const entitiesListQuery = (caseId: string) =>
  queryOptions({
    queryKey: entitiesKeys.all(caseId),
    queryFn: async () => listEntitiesFn({ data: { caseId } }),
    staleTime: STALE_DEFAULT,
    gcTime: GC_DEFAULT,
  });

export const entityBySlugQuery = (caseId: string, slug: string) =>
  queryOptions({
    queryKey: entitiesKeys.detail(caseId, slug),
    queryFn: async () => getEntityBySlugFn({ data: { caseId, slug } }),
    staleTime: STALE_DEFAULT,
    gcTime: GC_DEFAULT,
  });
