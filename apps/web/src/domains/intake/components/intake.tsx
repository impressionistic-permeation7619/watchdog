import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, Suspense } from "react";

import { casesContextQuery } from "@/domains/cases/queries";
import type { CaseRecord } from "@/domains/cases/types";
import { entitiesListQuery } from "@/domains/entities/queries";
import {
  DumpDialogs,
  type DumpModal,
} from "@/domains/intake/components/dump-dialogs";
import { EvidenceDetail } from "@/domains/intake/components/evidence-detail";
import { EvidenceQueueList } from "@/domains/intake/components/evidence-queue-list";
import { IntakeQueueToolbar } from "@/domains/intake/components/intake-queue-toolbar";
import { useIntakeActions } from "@/domains/intake/hooks/use-intake-actions";
import {
  EMPTY_INTAKE_FILTERS,
  filterIntakeQueue,
  type IntakeQueueFilters,
} from "@/domains/intake/lib/filters";
import { evidenceListQuery } from "@/domains/intake/queries";
import type { EvidenceRecord } from "@/domains/intake/types";
import type { JobListRecord } from "@/domains/jobs/jobs.functions";
import { jobsListQuery } from "@/domains/jobs/queries";
import { useLiveEvents } from "@/shared/hooks/use-live-events";
import { PageHeader } from "@/shared/layout/page";
import {
  bindCasesChangedInvalidation,
  invalidateAfterJobMutation,
  invalidateEvidence,
} from "@/shared/lib/query-invalidation";
import { resolveQueueSelection } from "@/shared/lib/queue-selection";
import { EmptyState } from "@/shared/ui/empty-state";
import { FormInlineError } from "@/shared/ui/form-inline-message";
import { QueueHeader } from "@/shared/ui/queue-header";
import { QueueShell } from "@/shared/ui/queue-shell";
import { Button } from "@/shared/ui/shadcn/button";
import { ButtonGroup } from "@/shared/ui/shadcn/button-group";
import { QueueSkeleton } from "@/shared/ui/skeletons";
import { SplitView } from "@/shared/ui/split-view";

function IntakeQueueBody({
  allRowsEmpty,
  rows,
  jobs,
  hiddenOnly,
  selectedId,
  onSelect,
  onShowActiveQueue,
  onDumpFile,
  onDumpPaste,
  onDumpUrl,
  searchQuery,
  onClearFilters,
}: {
  allRowsEmpty: boolean;
  rows: EvidenceRecord[];
  jobs: JobListRecord[];
  hiddenOnly: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onShowActiveQueue: () => void;
  onDumpFile: () => void;
  onDumpPaste: () => void;
  onDumpUrl: () => void;
  searchQuery: string;
  onClearFilters: () => void;
}) {
  if (allRowsEmpty && hiddenOnly) {
    return (
      <EmptyState
        intent="blank-slate"
        items="evidence"
        title="No Hidden Evidence"
        description="Hidden dumps appear here. Clear the Hidden filter to return to the active queue."
        action={
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onShowActiveQueue}
          >
            Show Active Queue
          </Button>
        }
      />
    );
  }
  if (allRowsEmpty) {
    return (
      <EmptyState
        intent="blank-slate"
        items="evidence"
        description="Use File, Paste, or URL to dump Evidence."
        action={
          <ButtonGroup>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onDumpFile}
            >
              File
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onDumpPaste}
            >
              Paste
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onDumpUrl}
            >
              URL
            </Button>
          </ButtonGroup>
        }
      />
    );
  }
  if (rows.length === 0) {
    return (
      <EmptyState
        intent="no-results"
        items="evidence"
        query={searchQuery}
        onClearFilters={onClearFilters}
      />
    );
  }
  return (
    <EvidenceQueueList
      rows={rows}
      jobs={jobs}
      selectedId={selectedId}
      onSelect={onSelect}
      showHiddenBadge={hiddenOnly}
    />
  );
}

function IntakeActive({
  active,
  evidenceId,
  onEvidenceIdChange,
}: {
  active: CaseRecord;
  evidenceId?: string;
  onEvidenceIdChange: (next: string | null) => void;
}) {
  const queryClient = useQueryClient();
  const { data: entities } = useSuspenseQuery(entitiesListQuery(active.id));
  const { data: jobs } = useSuspenseQuery(jobsListQuery(active.id));

  const [filters, setFilters] =
    useState<IntakeQueueFilters>(EMPTY_INTAKE_FILTERS);
  const [dumpModal, setDumpModal] = useState<DumpModal | null>(null);

  const { data: allRows } = useSuspenseQuery(
    evidenceListQuery(active.id, { hiddenOnly: filters.hiddenOnly })
  );

  const rows = useMemo(
    () => filterIntakeQueue(allRows, filters),
    [allRows, filters]
  );

  // URL is SoT for selection. If the linked id is filtered out (or missing),
  // fall back to the first visible row — same behavior as the old local state.
  const selectedId = resolveQueueSelection(evidenceId, rows);
  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId]
  );

  const entityNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const ent of entities) map.set(ent.id, ent.name);
    return map;
  }, [entities]);

  const {
    actionError,
    entityId,
    setEntityId,
    busy,
    uploading,
    uploadStatus,
    dumpingPaste,
    dumpingUrl,
    onFiles,
    onPaste,
    onUrl,
    evidenceActions,
  } = useIntakeActions({
    caseId: active.id,
    selectedEvidenceId: selectedId,
    onEvidenceIdChange,
    closeDumpModal: () => {
      setDumpModal(null);
    },
    onRestoreShowActiveQueue: () => {
      setFilters((prev) => ({ ...prev, hiddenOnly: false }));
    },
  });

  useEffect(() => bindCasesChangedInvalidation(queryClient), [queryClient]);

  useLiveEvents(active.id, (event) => {
    if (event.type === "job_update") {
      void invalidateAfterJobMutation(queryClient, active.id);
      void invalidateEvidence(queryClient, active.id);
    }
  });

  // Keep ?evidenceId= aligned with the resolved selection (auto-fallback /
  // empty queue) via router Navigate — not a sync effect.
  if ((evidenceId ?? null) !== selectedId) {
    return (
      <Navigate
        to="/intake"
        search={(prev) => ({
          ...prev,
          evidenceId: selectedId ?? undefined,
        })}
        replace
      />
    );
  }

  return (
    <>
      <IntakeQueueToolbar
        entities={entities}
        entityId={entityId}
        onEntityIdChange={setEntityId}
        filters={filters}
        onFiltersChange={setFilters}
        dumpDisabled={busy}
        onDump={setDumpModal}
      />

      <FormInlineError>{actionError}</FormInlineError>

      <DumpDialogs
        open={dumpModal}
        onOpenChange={setDumpModal}
        busy={busy}
        uploading={uploading}
        dumpingPaste={dumpingPaste}
        dumpingUrl={dumpingUrl}
        uploadStatus={uploadStatus}
        entities={entities}
        entityId={entityId}
        onEntityIdChange={setEntityId}
        onFiles={onFiles}
        onPaste={onPaste}
        onUrl={onUrl}
      />

      <SplitView
        key="intake-split"
        groupId="intake"
        list={
          <QueueShell
            aria-label="Evidence queue"
            header={
              <QueueHeader
                label={filters.hiddenOnly ? "Hidden" : "Queue"}
                count={
                  rows.length === allRows.length
                    ? allRows.length
                    : `${rows.length} / ${allRows.length}`
                }
              />
            }
          >
            <IntakeQueueBody
              allRowsEmpty={allRows.length === 0}
              rows={rows}
              jobs={jobs}
              hiddenOnly={filters.hiddenOnly}
              selectedId={selectedId}
              onSelect={(id) => {
                onEvidenceIdChange(id);
              }}
              onShowActiveQueue={() => {
                setFilters({ ...filters, hiddenOnly: false });
              }}
              onDumpFile={() => {
                setDumpModal("file");
              }}
              onDumpPaste={() => {
                setDumpModal("paste");
              }}
              onDumpUrl={() => {
                setDumpModal("url");
              }}
              searchQuery={filters.q}
              onClearFilters={() => {
                setFilters(EMPTY_INTAKE_FILTERS);
              }}
            />
          </QueueShell>
        }
        detail={
          allRows.length === 0 ? (
            <div className="h-full" aria-hidden />
          ) : (
            <EvidenceDetail
              key={selected?.id ?? "none"}
              evidence={selected}
              caseId={active.id}
              jobs={jobs}
              entities={entities}
              entityName={
                selected?.entityId !== null &&
                selected?.entityId !== undefined &&
                selected.entityId !== ""
                  ? (entityNameById.get(selected.entityId) ?? null)
                  : null
              }
              allowThirdPartyEgress={active.allowThirdPartyEgress}
              actions={evidenceActions}
            />
          )
        }
      />
    </>
  );
}

export function Intake({
  evidenceId,
  onEvidenceIdChange,
}: {
  evidenceId?: string;
  onEvidenceIdChange: (next: string | null) => void;
}) {
  const { data: casesCtx } = useSuspenseQuery(casesContextQuery());

  return (
    <>
      <PageHeader />

      {casesCtx.active ? (
        <Suspense
          fallback={
            <div
              className="min-h-0 flex-1 overflow-hidden"
              aria-busy
              aria-live="polite"
            >
              <QueueSkeleton rows={10} />
            </div>
          }
        >
          <IntakeActive
            active={casesCtx.active}
            evidenceId={evidenceId}
            onEvidenceIdChange={onEvidenceIdChange}
          />
        </Suspense>
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
              to dump Evidence.
            </>
          }
        />
      )}
    </>
  );
}
