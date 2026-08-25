import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { useCallback } from "react";
import { z } from "zod";

import { casesContextQuery } from "@/domains/cases/queries";
import { entitiesListQuery } from "@/domains/entities/queries";
import { evidenceListQuery } from "@/domains/intake/queries";
import { Jobs } from "@/domains/jobs/components/jobs";
import {
  capabilitiesListQuery,
  jobsListQuery,
  playbooksListQuery,
} from "@/domains/jobs/queries";
import { credentialsListQuery } from "@/domains/settings/queries";
import { Page } from "@/shared/layout/page";
import { RouteError } from "@/shared/layout/route-error";
import { RoutePending } from "@/shared/layout/route-pending";
import { uuidSchema } from "@watchdog/schemas";

const routeApi = getRouteApi("/_protected/jobs/");

function JobsPage() {
  const { jobId } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const onJobIdChange = useCallback(
    (next: string | null) => {
      void navigate({
        search: (prev) => ({
          ...prev,
          jobId: next ?? undefined,
        }),
        replace: true,
      });
    },
    [navigate]
  );
  return (
    <Page density="split">
      <Jobs jobId={jobId} onJobIdChange={onJobIdChange} />
    </Page>
  );
}

export const Route = createFileRoute("/_protected/jobs/")({
  validateSearch: z.object({ jobId: uuidSchema.optional() }),
  loader: async ({ context: { queryClient } }) => {
    const { active } = await queryClient.ensureQueryData(casesContextQuery());
    // Queue paint needs jobs (+ caps/playbooks for launch). Warm secondary lists.
    await Promise.all([
      queryClient.ensureQueryData(capabilitiesListQuery()),
      queryClient.ensureQueryData(playbooksListQuery()),
      queryClient.ensureQueryData(credentialsListQuery()),
      active
        ? queryClient.ensureQueryData(jobsListQuery(active.id))
        : Promise.resolve(),
    ]);
    if (active) {
      void queryClient.prefetchQuery(entitiesListQuery(active.id));
      void queryClient.prefetchQuery(evidenceListQuery(active.id));
    }
  },
  pendingComponent: RoutePending,
  errorComponent: RouteError,
  component: JobsPage,
});
