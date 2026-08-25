import { createFileRoute } from "@tanstack/react-router";

import { casesContextQuery } from "@/domains/cases/queries";
import { DashboardHome } from "@/domains/dashboard/components/dashboard-home";
import { warmDashboardQueries } from "@/domains/dashboard/lib/prefetch-dashboard";
import { RouteError } from "@/shared/layout/route-error";

export const Route = createFileRoute("/_protected/")({
  loader: async ({ context: { queryClient } }) => {
    const { active } = await queryClient.ensureQueryData(casesContextQuery());
    warmDashboardQueries(queryClient, active?.id ?? null);
  },
  // Thin loader — shell paints immediately; body Suspense / region skeletons fill data.
  errorComponent: RouteError,
  component: DashboardHome,
});
