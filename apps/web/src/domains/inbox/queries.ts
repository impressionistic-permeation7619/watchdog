import { queryOptions } from "@tanstack/react-query";

import { listProposalsFn } from "@/domains/inbox/inbox.functions";
import { GC_REALTIME, STALE_REALTIME } from "@/shared/lib/query-stale";
import type { ProposalStatus } from "@watchdog/schemas";

export const proposalsKeys = {
  all: (caseId: string) => ["proposals", caseId] as const,
  status: (caseId: string, status: ProposalStatus) =>
    ["proposals", caseId, status] as const,
};

export const proposalsByStatusQuery = (
  caseId: string,
  status: ProposalStatus
) =>
  queryOptions({
    queryKey: proposalsKeys.status(caseId, status),
    queryFn: async () => listProposalsFn({ data: { caseId, status } }),
    staleTime: STALE_REALTIME,
    gcTime: GC_REALTIME,
  });

/** Concatenated pending + accepted + rejected for Inbox queue. */
export const allProposalsQuery = (caseId: string) =>
  queryOptions({
    queryKey: proposalsKeys.all(caseId),
    queryFn: async () => {
      const [pending, accepted, rejected] = await Promise.all([
        listProposalsFn({ data: { caseId, status: "pending" } }),
        listProposalsFn({ data: { caseId, status: "accepted" } }),
        listProposalsFn({ data: { caseId, status: "rejected" } }),
      ]);
      return [...pending, ...accepted, ...rejected];
    },
    staleTime: STALE_REALTIME,
    gcTime: GC_REALTIME,
  });
