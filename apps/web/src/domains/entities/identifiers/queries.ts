import { queryOptions } from "@tanstack/react-query";

import {
  listIdentifiersFn,
  listIdentifiersForCaseFn,
} from "@/domains/entities/identifiers/identifiers.functions";
import { GC_DEFAULT, STALE_DEFAULT } from "@/shared/lib/query-stale";

export const identifiersKeys = {
  prefix: (caseId: string) => ["identifiers", caseId] as const,
  all: (caseId: string, entityId: string) =>
    ["identifiers", caseId, entityId] as const,
  forCase: (caseId: string) => ["identifiers", caseId, "case"] as const,
};

export const identifiersListQuery = (caseId: string, entityId: string) =>
  queryOptions({
    queryKey: identifiersKeys.all(caseId, entityId),
    queryFn: async () => listIdentifiersFn({ data: { caseId, entityId } }),
    staleTime: STALE_DEFAULT,
    gcTime: GC_DEFAULT,
  });

export const identifiersForCaseQuery = (caseId: string) =>
  queryOptions({
    queryKey: identifiersKeys.forCase(caseId),
    queryFn: async () => listIdentifiersForCaseFn({ data: { caseId } }),
    staleTime: STALE_DEFAULT,
    gcTime: GC_DEFAULT,
  });
