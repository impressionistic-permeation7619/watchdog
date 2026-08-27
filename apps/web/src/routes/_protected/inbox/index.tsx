import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { useCallback } from "react";
import { z } from "zod";

import { casesContextQuery } from "@/domains/cases/queries";
import { Inbox } from "@/domains/inbox/components/inbox";
import { allProposalsQuery } from "@/domains/inbox/queries";
import { evidenceListQuery } from "@/domains/intake/queries";
import { Page } from "@/shared/layout/page";
import { RouteError } from "@/shared/layout/route-error";
import { RoutePending } from "@/shared/layout/route-pending";
import { PROPOSAL_STATUSES, uuidSchema } from "@watchdog/schemas";

const routeApi = getRouteApi("/_protected/inbox/");

function InboxPage() {
  const { proposalId, status } = routeApi.useSearch();
  const navigate = routeApi.useNavigate();
  const onProposalIdChange = useCallback(
    (next: string | null) => {
      void navigate({
        search: (prev) => ({
          ...prev,
          proposalId: next ?? undefined,
        }),
        replace: true,
      });
    },
    [navigate]
  );
  return (
    <Page density="split">
      <Inbox
        proposalId={proposalId}
        initialStatus={status}
        onProposalIdChange={onProposalIdChange}
      />
    </Page>
  );
}

export const Route = createFileRoute("/_protected/inbox/")({
  validateSearch: z.object({
    proposalId: uuidSchema.optional(),
    status: z.enum(PROPOSAL_STATUSES).optional(),
  }),
  loader: async ({ context: { queryClient } }) => {
    const { active } = await queryClient.ensureQueryData(casesContextQuery());
    if (active) {
      await queryClient.ensureQueryData(allProposalsQuery(active.id));
      // Detail band loads evidence via useQuery ([] fallback); warm in parallel.
      void queryClient.prefetchQuery(evidenceListQuery(active.id));
    }
  },
  pendingComponent: RoutePending,
  errorComponent: RouteError,
  component: InboxPage,
});
