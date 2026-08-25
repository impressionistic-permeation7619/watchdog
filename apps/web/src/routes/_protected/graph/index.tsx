import { createFileRoute } from "@tanstack/react-router";

import { GraphPage } from "@/domains/cases/components/graph-page";
import { casesContextQuery } from "@/domains/cases/queries";
import { edgesForCaseQuery } from "@/domains/entities/edges/queries";
import { entitiesListQuery } from "@/domains/entities/queries";
import { RouteError } from "@/shared/layout/route-error";
import { RoutePending } from "@/shared/layout/route-pending";

export const Route = createFileRoute("/_protected/graph/")({
  loader: async ({ context: { queryClient } }) => {
    const { active } = await queryClient.ensureQueryData(casesContextQuery());
    if (active) {
      await Promise.all([
        queryClient.ensureQueryData(entitiesListQuery(active.id)),
        queryClient.ensureQueryData(edgesForCaseQuery(active.id)),
      ]);
    }
  },
  pendingComponent: RoutePending,
  errorComponent: RouteError,
  component: GraphPage,
});
