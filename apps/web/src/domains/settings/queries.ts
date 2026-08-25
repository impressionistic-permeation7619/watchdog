import { queryOptions } from "@tanstack/react-query";

import { listCredentialsFn } from "@/domains/settings/settings.functions";
import { GC_STABLE, STALE_STABLE } from "@/shared/lib/query-stale";

export const credentialsKeys = {
  all: ["credentials"] as const,
};

export const credentialsListQuery = () =>
  queryOptions({
    queryKey: credentialsKeys.all,
    queryFn: async () => listCredentialsFn(),
    staleTime: STALE_STABLE,
    gcTime: GC_STABLE,
  });
