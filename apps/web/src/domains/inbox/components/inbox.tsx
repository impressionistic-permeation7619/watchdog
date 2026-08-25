import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { casesContextQuery } from "@/domains/cases/queries";
import type { CaseRecord } from "@/domains/cases/types";
import { InboxDetail } from "@/domains/inbox/components/inbox-detail";
import { InboxQueueList } from "@/domains/inbox/components/inbox-queue-list";
import { InboxQueueToolbar } from "@/domains/inbox/components/inbox-queue-toolbar";
import { useInboxWorkspace } from "@/domains/inbox/hooks/use-inbox-workspace";
import {
  EMPTY_INBOX_FILTERS,
  isInboxPendingOnlyFilters,
  type InboxQueueFilters,
} from "@/domains/inbox/lib/filters";
import { PageHeader } from "@/shared/layout/page";
import { bindCasesChangedInvalidation } from "@/shared/lib/query-invalidation";
import { EmptyState } from "@/shared/ui/empty-state";
import { QueueHeader } from "@/shared/ui/queue-header";
import { QueueShell } from "@/shared/ui/queue-shell";
import { Button } from "@/shared/ui/shadcn/button";
import { SplitView } from "@/shared/ui/split-view";
import type { ProposalStatus } from "@watchdog/schemas";

function InboxQueueEmptyState({
  hasAnyProposals,
  pendingOnly,
  filters,
  onClearFilters,
}: {
  hasAnyProposals: boolean;
  pendingOnly: boolean;
  filters: InboxQueueFilters;
  onClearFilters: () => void;
}) {
  if (!hasAnyProposals) {
    return (
      <EmptyState
        intent="blank-slate"
        items="proposals"
        description="Capability jobs land proposals here for review."
        action={
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link to="/jobs" />}
          >
            Open Jobs
          </Button>
        }
      />
    );
  }
  if (pendingOnly) {
    return (
      <EmptyState
        intent="cleared"
        items="proposals"
        description="No pending proposals. Show all to browse accepted and rejected."
        onClearFilters={onClearFilters}
      />
    );
  }
  return (
    <EmptyState
      intent="no-results"
      items="proposals"
      query={filters.q}
      onClearFilters={onClearFilters}
    />
  );
}

function InboxActive({
  active,
  proposalId,
  initialStatus,
  onProposalIdChange,
}: {
  active: CaseRecord;
  proposalId?: string;
  initialStatus?: ProposalStatus;
  onProposalIdChange: (next: string | null) => void;
}) {
  const queryClient = useQueryClient();
  const ws = useInboxWorkspace(active.id, { proposalId, initialStatus });

  useEffect(() => bindCasesChangedInvalidation(queryClient), [queryClient]);

  // Keep ?proposalId= aligned with resolved selection via Navigate (not a sync effect).
  if (ws.selectionOutOfSync) {
    return (
      <Navigate
        to="/inbox"
        search={(prev) => ({
          ...prev,
          proposalId: ws.selectedId ?? undefined,
        })}
        replace
      />
    );
  }

  return (
    <>
      <InboxQueueToolbar
        filters={ws.filters}
        onFiltersChange={(next) => {
          ws.setFilters(next);
        }}
        pendingCount={ws.pendingCount}
      />

      <SplitView
        key="inbox-split"
        groupId="inbox"
        list={
          <QueueShell
            aria-label="Proposal queue"
            header={
              <QueueHeader
                label="Queue"
                count={
                  ws.rows.length === ws.allProposals.length
                    ? ws.allProposals.length
                    : `${ws.rows.length} / ${ws.allProposals.length}`
                }
              />
            }
          >
            {ws.rows.length === 0 ? (
              <InboxQueueEmptyState
                hasAnyProposals={ws.allProposals.length > 0}
                pendingOnly={isInboxPendingOnlyFilters(ws.filters)}
                filters={ws.filters}
                onClearFilters={() => {
                  ws.setFilters(EMPTY_INBOX_FILTERS);
                }}
              />
            ) : (
              <InboxQueueList
                proposals={ws.rows}
                selectedId={ws.selectedId}
                onSelect={(id) => {
                  onProposalIdChange(id);
                }}
              />
            )}
          </QueueShell>
        }
        detail={
          ws.allProposals.length === 0 ? (
            <div className="h-full" aria-hidden />
          ) : (
            <InboxDetail
              proposal={ws.selected}
              caseId={active.id}
              pending={ws.pending}
              error={ws.error}
              onAccept={ws.handleAccept}
              onReject={ws.handleReject}
            />
          )
        }
      />
    </>
  );
}

export function Inbox({
  proposalId,
  initialStatus,
  onProposalIdChange,
}: {
  proposalId?: string;
  initialStatus?: ProposalStatus;
  onProposalIdChange: (next: string | null) => void;
}) {
  const { data: casesCtx } = useSuspenseQuery(casesContextQuery());

  return (
    <>
      <PageHeader />

      {casesCtx.active ? (
        <InboxActive
          active={casesCtx.active}
          proposalId={proposalId}
          initialStatus={initialStatus}
          onProposalIdChange={onProposalIdChange}
        />
      ) : (
        <EmptyState
          intent="blank-slate"
          items="cases"
          title="No Active Case"
          description={
            <>
              <Link to="/cases" className="underline">
                Select a Case
              </Link>{" "}
              to review proposals.
            </>
          }
        />
      )}
    </>
  );
}
