import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { z } from "zod";

import { casesContextQuery } from "@/domains/cases/queries";
import { entitiesListQuery } from "@/domains/entities/queries";
import { TasksPage } from "@/domains/tasks/components/tasks-page";
import { tasksListQuery } from "@/domains/tasks/queries";
import { RouteError } from "@/shared/layout/route-error";
import { RoutePending } from "@/shared/layout/route-pending";
import { uuidSchema } from "@watchdog/schemas";

const routeApi = getRouteApi("/_protected/tasks/");

function TasksRoutePage() {
  const { entityId } = routeApi.useSearch();
  return <TasksPage entityId={entityId} />;
}

export const Route = createFileRoute("/_protected/tasks/")({
  validateSearch: z.object({
    entityId: uuidSchema.optional(),
  }),
  loaderDeps: ({ search: { entityId } }) => ({ entityId }),
  loader: async ({ context: { queryClient }, deps: { entityId } }) => {
    const { active } = await queryClient.ensureQueryData(casesContextQuery());
    if (!active) return;
    await queryClient.ensureQueryData(
      tasksListQuery(active.id, entityId ? { entityId } : undefined)
    );
    void queryClient.prefetchQuery(entitiesListQuery(active.id));
  },
  pendingComponent: RoutePending,
  errorComponent: RouteError,
  component: TasksRoutePage,
});
