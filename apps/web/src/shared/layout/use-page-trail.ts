import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";

import { casesContextQuery } from "@/domains/cases/queries";
import { entityBySlugQuery } from "@/domains/entities/queries";
import { buildPageTrail, type TrailItem } from "@/shared/layout/page-trail";

function trailParams(matches: readonly { params: Record<string, unknown> }[]): {
  caseSlug?: string;
  entitySlug?: string;
} {
  const merged: { caseSlug?: string; entitySlug?: string } = {};
  for (const { params } of matches) {
    if (typeof params.caseSlug === "string") merged.caseSlug = params.caseSlug;
    if (typeof params.entitySlug === "string") {
      merged.entitySlug = params.entitySlug;
    }
  }
  return merged;
}

export function usePageTrail(): {
  items: TrailItem[];
  pendingLast: boolean;
} {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const params = useRouterState({
    select: (s) => trailParams(s.matches),
  });

  const casesQuery = useQuery(casesContextQuery());
  const activeCase = casesQuery.data?.active ?? null;
  const routeCase =
    params.caseSlug === undefined
      ? null
      : (casesQuery.data?.cases.find((row) => row.slug === params.caseSlug) ??
        (activeCase?.slug === params.caseSlug ? activeCase : null));

  const entityQuery = useQuery({
    ...entityBySlugQuery(activeCase?.id ?? "", params.entitySlug ?? ""),
    enabled: Boolean(activeCase?.id && params.entitySlug),
  });

  const items = buildPageTrail({
    pathname,
    activeCase,
    routeCase,
    entity: entityQuery.data ?? null,
  });

  const pendingLast = Boolean(
    activeCase?.id &&
    params.entitySlug &&
    entityQuery.isPending &&
    !entityQuery.data
  );

  return { items, pendingLast };
}
