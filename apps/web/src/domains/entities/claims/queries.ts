import { queryOptions } from "@tanstack/react-query";

import { listClaimsFn } from "@/domains/entities/claims/claims.functions";
import { GC_DEFAULT, STALE_DEFAULT } from "@/shared/lib/query-stale";

export const claimsKeys = {
  prefix: (caseId: string) => ["claims", caseId] as const,
  all: (caseId: string, entityId: string) =>
    ["claims", caseId, entityId] as const,
};

export const claimsListQuery = (caseId: string, entityId: string) =>
  queryOptions({
    queryKey: claimsKeys.all(caseId, entityId),
    queryFn: async () =>
      listClaimsFn({
        data: { caseId, entityId, includeRetracted: true },
      }),
    staleTime: STALE_DEFAULT,
    gcTime: GC_DEFAULT,
  });
