import { queryOptions } from "@tanstack/react-query";

import { listQuestionsFn } from "@/domains/entities/questions/questions.functions";
import { GC_DEFAULT, STALE_DEFAULT } from "@/shared/lib/query-stale";

export const questionsKeys = {
  prefix: (caseId: string) => ["questions", caseId] as const,
  all: (caseId: string, entityId: string) =>
    ["questions", caseId, entityId] as const,
};

export const questionsListQuery = (caseId: string, entityId: string) =>
  queryOptions({
    queryKey: questionsKeys.all(caseId, entityId),
    queryFn: async () => listQuestionsFn({ data: { caseId, entityId } }),
    staleTime: STALE_DEFAULT,
    gcTime: GC_DEFAULT,
  });
