import { createFileRoute } from "@tanstack/react-router";

import { casesContextQuery } from "@/domains/cases/queries";
import { IdentifiersPage } from "@/domains/entities/components/identifiers-page";
import { identifiersForCaseQuery } from "@/domains/entities/identifiers/queries";
import { entitiesListQuery } from "@/domains/entities/queries";
import { evidenceListQuery } from "@/domains/intake/queries";
import { RouteError } from "@/shared/layout/route-error";
import { RoutePending } from "@/shared/layout/route-pending";

export const Route = createFileRoute("/_protected/identifiers/")({
  loader: async ({ context: { queryClient } }) => {
    const { active } = await queryClient.ensureQueryData(casesContextQuery());
    if (active) {
      await Promise.all([
        queryClient.ensureQueryData(identifiersForCaseQuery(active.id)),
        queryClient.ensureQueryData(entitiesListQuery(active.id)),
        queryClient.ensureQueryData(evidenceListQuery(active.id)),
      ]);
    }
  },
  pendingComponent: RoutePending,
  errorComponent: RouteError,
  component: IdentifiersPage,
});
