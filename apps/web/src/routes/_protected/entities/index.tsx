import { createFileRoute } from "@tanstack/react-router";

import { casesContextQuery } from "@/domains/cases/queries";
import { EntityTable } from "@/domains/entities/components/entity-table";
import { edgesForCaseQuery } from "@/domains/entities/edges/queries";
import { entitiesListQuery } from "@/domains/entities/queries";
import { RouteError } from "@/shared/layout/route-error";
import { RoutePending } from "@/shared/layout/route-pending";

function EntitiesPage() {
  return <EntityTable />;
}

export const Route = createFileRoute("/_protected/entities/")({
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
  component: EntitiesPage,
});
