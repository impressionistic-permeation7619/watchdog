import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  acceptProposalFn,
  rejectProposalFn,
} from "@/domains/inbox/inbox.functions";
import {
  filterInboxQueue,
  PENDING_INBOX_FILTERS,
  type InboxQueueFilters,
} from "@/domains/inbox/lib/filters";
import { allProposalsQuery } from "@/domains/inbox/queries";
import type { AcceptFormValues } from "@/domains/inbox/types";
import { errMessage } from "@/lib/utils";
import { useLiveEvents } from "@/shared/hooks/use-live-events";
import {
  invalidateAfterProposalAccept,
  invalidateAfterProposalQueueChange,
} from "@/shared/lib/query-invalidation";
import { resolveQueueSelection } from "@/shared/lib/queue-selection";
import { patchNeedsConfidence } from "@watchdog/policy";
import type { ProposalStatus } from "@watchdog/schemas";

export interface UseInboxWorkspaceOptions {
  proposalId?: string;
  initialStatus?: ProposalStatus;
}

export function useInboxWorkspace(
  caseId: string,
  { proposalId, initialStatus }: UseInboxWorkspaceOptions
) {
  const queryClient = useQueryClient();
  const { data: allProposals } = useSuspenseQuery(allProposalsQuery(caseId));

  const [filters, setFilters] = useState<InboxQueueFilters>(() =>
    initialStatus ? { q: "", statuses: [initialStatus] } : PENDING_INBOX_FILTERS
  );
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(
    () => filterInboxQueue(allProposals, filters),
    [allProposals, filters]
  );
  const pendingCount = useMemo(
    () => allProposals.filter((r) => r.status === "pending").length,
    [allProposals]
  );

  const selectedId = resolveQueueSelection(proposalId, rows);
  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId]
  );

  useLiveEvents(caseId, (event) => {
    if (event.type === "proposal_created") {
      setFilters((prev) => ({ ...PENDING_INBOX_FILTERS, q: prev.q }));
      void invalidateAfterProposalQueueChange(queryClient, caseId);
    }
  });

  const [prevSelectedProposalId, setPrevSelectedProposalId] = useState(
    selected?.id ?? null
  );
  if ((selected?.id ?? null) !== prevSelectedProposalId) {
    setPrevSelectedProposalId(selected?.id ?? null);
    setError(null);
  }

  const acceptMutation = useMutation({
    mutationFn: async (values: AcceptFormValues) => {
      if (!selected) throw new Error("Nothing selected");
      const needs = patchNeedsConfidence(selected.patch);
      return acceptProposalFn({
        data: {
          caseId,
          proposalId: selected.id,
          confidence: needs ? values.confidence : undefined,
          sharedEvidenceIds: values.evidenceIds,
          attestationText: values.attestationText.trim() || undefined,
        },
      });
    },
    onSuccess: async () => {
      toast.success("Proposal accepted");
      setFilters(PENDING_INBOX_FILTERS);
      await invalidateAfterProposalAccept(queryClient, caseId);
    },
    onError: (e) => {
      setError(errMessage(e, "Accept failed"));
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (reason: string) => {
      if (!selected) throw new Error("Nothing selected");
      return rejectProposalFn({
        data: {
          caseId,
          proposalId: selected.id,
          reason: reason.trim() || undefined,
        },
      });
    },
    onSuccess: async () => {
      toast.success("Proposal rejected");
      setFilters(PENDING_INBOX_FILTERS);
      await invalidateAfterProposalQueueChange(queryClient, caseId);
    },
    onError: (e) => {
      setError(errMessage(e, "Reject failed"));
    },
  });

  return {
    allProposals,
    rows,
    filters,
    setFilters,
    pendingCount,
    selectedId,
    selected,
    error,
    setError,
    pending: acceptMutation.isPending || rejectMutation.isPending,
    selectionOutOfSync: (proposalId ?? null) !== selectedId,
    handleAccept: (values: AcceptFormValues) => {
      setError(null);
      acceptMutation.mutate(values);
    },
    handleReject: (reason: string) => {
      setError(null);
      rejectMutation.mutate(reason);
    },
  };
}
