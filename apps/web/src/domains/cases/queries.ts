import { queryOptions } from "@tanstack/react-query";

import {
  getCaseByIdFn,
  getCaseBySlugFn,
  getCasesContextFn,
} from "@/domains/cases/cases.functions";
import { GC_DEFAULT, STALE_DEFAULT } from "@/shared/lib/query-stale";

export const casesKeys = {
  all: ["cases"] as const,
  context: () => ["cases", "context"] as const,
  detail: (caseId: string) => ["cases", "detail", caseId] as const,
  bySlug: (caseSlug: string) => ["cases", "bySlug", caseSlug] as const,
};

export const casesContextQuery = () =>
  queryOptions({
    queryKey: casesKeys.context(),
    queryFn: async () => getCasesContextFn(),
    staleTime: STALE_DEFAULT,
    gcTime: GC_DEFAULT,
  });

export const caseByIdQuery = (caseId: string) =>
  queryOptions({
    queryKey: casesKeys.detail(caseId),
    queryFn: async () => getCaseByIdFn({ data: { caseId } }),
    staleTime: STALE_DEFAULT,
    gcTime: GC_DEFAULT,
  });

export const caseBySlugQuery = (caseSlug: string) =>
  queryOptions({
    queryKey: casesKeys.bySlug(caseSlug),
    queryFn: async () => getCaseBySlugFn({ data: { caseSlug } }),
    staleTime: STALE_DEFAULT,
    gcTime: GC_DEFAULT,
  });
