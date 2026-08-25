import { createFileRoute } from "@tanstack/react-router";

import { CaseList } from "@/domains/cases/components/case-list";
import { casesContextQuery } from "@/domains/cases/queries";
import { RouteError } from "@/shared/layout/route-error";
import { RoutePending } from "@/shared/layout/route-pending";

function CasesPage() {
  return <CaseList />;
}

export const Route = createFileRoute("/_protected/cases/")({
  loader: async ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(casesContextQuery()),
  pendingComponent: RoutePending,
  errorComponent: RouteError,
  component: CasesPage,
});
