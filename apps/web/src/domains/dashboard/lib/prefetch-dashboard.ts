import type { QueryClient } from "@tanstack/react-query";

import { recentActivityQuery } from "@/domains/activity/queries";
import { entitiesListQuery } from "@/domains/entities/queries";
import { proposalsByStatusQuery } from "@/domains/inbox/queries";
import { jobsListQuery } from "@/domains/jobs/queries";
import { tasksListQuery } from "@/domains/tasks/queries";

/** Warm Dashboard panels / activity without blocking shell paint. */
export function warmDashboardQueries(
  queryClient: QueryClient,
  activeCaseId: string | null
): void {
  void queryClient.ensureQueryData({
    ...recentActivityQuery(),
    revalidateIfStale: true,
  });
  if (activeCaseId === null) return;
  void queryClient.prefetchQuery(entitiesListQuery(activeCaseId));
  void queryClient.prefetchQuery(
    proposalsByStatusQuery(activeCaseId, "pending")
  );
  void queryClient.prefetchQuery(jobsListQuery(activeCaseId));
  void queryClient.prefetchQuery(tasksListQuery(activeCaseId));
}
