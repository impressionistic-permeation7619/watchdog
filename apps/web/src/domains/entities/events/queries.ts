import { queryOptions } from "@tanstack/react-query";

import { listEventsFn } from "@/domains/entities/events/events.functions";
import { GC_DEFAULT, STALE_DEFAULT } from "@/shared/lib/query-stale";

export const eventsKeys = {
  prefix: (caseId: string) => ["events", caseId] as const,
  all: (caseId: string, entityId: string) =>
    ["events", caseId, entityId] as const,
};

export const eventsListQuery = (caseId: string, entityId: string) =>
  queryOptions({
    queryKey: eventsKeys.all(caseId, entityId),
    queryFn: async () => listEventsFn({ data: { caseId, entityId } }),
    staleTime: STALE_DEFAULT,
    gcTime: GC_DEFAULT,
  });
