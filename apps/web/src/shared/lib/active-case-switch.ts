import type { QueryClient } from "@tanstack/react-query";

import { bumpActiveCaseHealEpoch } from "@/domains/cases/lib/active-case";
import { casesKeys } from "@/domains/cases/queries";
import type { CaseRecord, CasesContext } from "@/domains/cases/types";

import { isCaseOverviewPath } from "./case-path";
import { invalidateAfterCaseSwitch } from "./query-invalidation";

export { isCaseOverviewPath } from "./case-path";

export async function optimisticActiveCaseSwitch(
  queryClient: QueryClient,
  cases: CaseRecord[],
  caseId: string
): Promise<{ prev: CasesContext | undefined; next: CaseRecord | undefined }> {
  const next = cases.find((c) => c.id === caseId);
  if (!next) {
    return { prev: undefined, next: undefined };
  }
  bumpActiveCaseHealEpoch();
  return queryClient
    .cancelQueries({ queryKey: casesKeys.context() })
    .then(() => {
      const prev = queryClient.getQueryData<CasesContext>(casesKeys.context());
      if (prev) {
        queryClient.setQueryData<CasesContext>(casesKeys.context(), {
          ...prev,
          active: next,
        });
      }
      return { prev, next };
    });
}

export function rollbackActiveCaseSwitch(
  queryClient: QueryClient,
  prev: CasesContext | undefined
): void {
  if (prev) {
    queryClient.setQueryData(casesKeys.context(), prev);
  }
}

export async function finalizeActiveCaseSwitch(
  queryClient: QueryClient,
  next: CaseRecord | undefined
): Promise<void> {
  return invalidateAfterCaseSwitch(queryClient).then(() => {
    if (next) {
      queryClient.setQueryData<CasesContext>(casesKeys.context(), (prev) =>
        prev ? { ...prev, active: next } : prev
      );
    }
  });
}

export async function navigateAfterActiveCaseSwitch(input: {
  next: CaseRecord;
  pathname: string;
  entityId?: string;
  navigate: (opts: {
    to: string;
    params?: Record<string, string>;
    search?: Record<string, never>;
    replace?: boolean;
  }) => Promise<void> | void;
}): Promise<void> {
  if (isCaseOverviewPath(input.pathname)) {
    await input.navigate({
      to: "/cases/$caseSlug",
      params: { caseSlug: input.next.slug },
      replace: true,
    });
    return;
  }
  if (input.pathname === "/tasks" && input.entityId) {
    await input.navigate({ to: "/tasks", search: {}, replace: true });
  }
}
