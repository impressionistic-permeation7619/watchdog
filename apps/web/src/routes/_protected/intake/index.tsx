import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { useCallback } from "react";
import { z } from "zod";

import { casesContextQuery } from "@/domains/cases/queries";
import { entitiesListQuery } from "@/domains/entities/queries";
import { Intake } from "@/domains/intake/components/intake";
import { evidenceListQuery } from "@/domains/intake/queries";
import { jobsListQuery } from "@/domains/jobs/queries";
import { Page } from "@/shared/layout/page";
import { RouteError } from "@/shared/layout/route-error";
import { RoutePending } from "@/shared/layout/route-pending";
import { uuidSchema } from "@watchdog/schemas";

const routeApi = getRouteApi("/_protected/intake/");

function IntakePage() {
  const { evidenceId } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const onEvidenceIdChange = useCallback(
    (next: string | null) => {
      void navigate({
        search: (prev) => ({
          ...prev,
          evidenceId: next ?? undefined,
        }),
        replace: true,
      });
    },
    [navigate]
  );
  return (
    <Page density="split">
      <Intake evidenceId={evidenceId} onEvidenceIdChange={onEvidenceIdChange} />
    </Page>
  );
}

export const Route = createFileRoute("/_protected/intake/")({
  validateSearch: z.object({ evidenceId: uuidSchema.optional() }),
  loader: async ({ context: { queryClient } }) => {
    const { active } = await queryClient.ensureQueryData(casesContextQuery());
    if (!active) return;
    await queryClient.ensureQueryData(evidenceListQuery(active.id));
    void queryClient.prefetchQuery(entitiesListQuery(active.id));
    void queryClient.prefetchQuery(jobsListQuery(active.id));
  },
  pendingComponent: RoutePending,
  errorComponent: RouteError,
  component: IntakePage,
});
