import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { Link, Navigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, Suspense } from "react";
import type { ReactNode } from "react";

import { casesContextQuery } from "@/domains/cases/queries";
import type { CaseRecord } from "@/domains/cases/types";
import { entitiesListQuery } from "@/domains/entities/queries";
import { evidenceTitle } from "@/domains/intake/lib/evidence";
import { evidenceListQuery } from "@/domains/intake/queries";
import { JobCapRunForm } from "@/domains/jobs/components/job-cap-run-form";
import { JobDetail } from "@/domains/jobs/components/job-detail";
import { JobPlaybookRunForm } from "@/domains/jobs/components/job-playbook-run-form";
import { JobQueueList } from "@/domains/jobs/components/job-queue-list";
import { JobQueueToolbar } from "@/domains/jobs/components/job-queue-toolbar";
import { useJobsWorkspace } from "@/domains/jobs/hooks/use-jobs-workspace";
import type { JobListRecord } from "@/domains/jobs/jobs.functions";
import {
  EMPTY_JOB_FILTERS,
  filterJobQueue,
  sortJobQueue,
  type JobQueueFilters,
} from "@/domains/jobs/lib/status";
import {
  capabilitiesListQuery,
  jobsListQuery,
  playbooksListQuery,
} from "@/domains/jobs/queries";
import type { CapListItem, PlaybookListItem } from "@/domains/jobs/types";
import { credentialsListQuery } from "@/domains/settings/queries";
import { PageHeader } from "@/shared/layout/page";
import { bindCasesChangedInvalidation } from "@/shared/lib/query-invalidation";
import { EmptyState } from "@/shared/ui/empty-state";
import { InlineLoading } from "@/shared/ui/inline-loading";
import { QueueHeader } from "@/shared/ui/queue-header";
import { QueueShell } from "@/shared/ui/queue-shell";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/shadcn/alert";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/shadcn/toggle-group";
import { QueueSkeleton } from "@/shared/ui/skeletons";
import { SplitView } from "@/shared/ui/split-view";

/**
 * Cap vs Playbook picks which run form the toolbar shows — it is a mode
 * selector, not a tab strip (no panel is owned by the trigger).
 */
const RUN_MODES = [
  { value: "cap", label: "Cap" },
  { value: "playbook", label: "Playbook" },
] as const;

type RunMode = (typeof RUN_MODES)[number]["value"];

function isRunMode(value: string | undefined): value is RunMode {
  return RUN_MODES.some((mode) => mode.value === value);
}

function RunModeToggle({
  value,
  onValueChange,
}: {
  value: RunMode;
  onValueChange: (next: RunMode) => void;
}) {
  return (
    <ToggleGroup
      aria-label="Run mode"
      spacing={1}
      value={[value]}
      onValueChange={(next: string[]) => {
        const mode = next[0];
        // Base UI clears the group when the pressed item is re-clicked; a mode
        // selector always keeps one mode.
        if (isRunMode(mode)) onValueChange(mode);
      }}
      className="bg-muted h-7 rounded-lg p-0.5"
    >
      {RUN_MODES.map((mode) => (
        <ToggleGroupItem
          key={mode.value}
          value={mode.value}
          size="sm"
          className="text-muted-foreground aria-pressed:bg-background aria-pressed:text-foreground h-6 px-2.5 text-xs aria-pressed:shadow-sm"
        >
          {mode.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

function JobQueueBody({
  hasAnyJobs,
  queue,
  selectedId,
  onSelect,
  searchQuery,
  onClearFilters,
  evidenceTitleById,
  recipeStepCountByPlaybookId,
}: {
  hasAnyJobs: boolean;
  queue: JobListRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onClearFilters: () => void;
  evidenceTitleById?: ReadonlyMap<string, string>;
  recipeStepCountByPlaybookId?: ReadonlyMap<string, number>;
}) {
  if (!hasAnyJobs) {
    return (
      <EmptyState
        intent="blank-slate"
        items="jobs"
        description="Run a Cap or Playbook using the form above."
      />
    );
  }
  if (queue.length === 0) {
    return (
      <EmptyState
        intent="no-results"
        items="jobs"
        query={searchQuery}
        onClearFilters={onClearFilters}
      />
    );
  }
  return (
    <JobQueueList
      jobs={queue}
      selectedId={selectedId}
      onSelect={onSelect}
      evidenceTitleById={evidenceTitleById}
      recipeStepCountByPlaybookId={recipeStepCountByPlaybookId}
    />
  );
}

function JobsActive({
  active,
  caps,
  playbooks,
  jobId,
  onJobIdChange,
}: {
  active: CaseRecord;
  caps: CapListItem[];
  playbooks: PlaybookListItem[];
  jobId?: string;
  onJobIdChange: (next: string | null) => void;
}) {
  const { data: entities } = useSuspenseQuery(entitiesListQuery(active.id));
  const { data: evidenceRows } = useSuspenseQuery(evidenceListQuery(active.id));
  const { data: credentialSlots } = useSuspenseQuery(credentialsListQuery());
  const configuredCredentials = useMemo(() => {
    const names = new Set<string>();
    for (const slot of credentialSlots) {
      if (slot.configured) names.add(slot.name);
    }
    return names;
  }, [credentialSlots]);
  const { data: jobsRaw, isFetching: jobsListFetching } = useSuspenseQuery(
    jobsListQuery(active.id)
  );
  const jobs = useMemo(() => sortJobQueue(jobsRaw), [jobsRaw]);
  const evidenceTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of evidenceRows) {
      map.set(row.id, evidenceTitle(row));
    }
    return map;
  }, [evidenceRows]);
  const recipeStepCountByPlaybookId = useMemo(() => {
    const map = new Map<string, number>();
    for (const playbook of playbooks) {
      map.set(playbook.id, playbook.steps.length);
    }
    return map;
  }, [playbooks]);
  const urlDumps = useMemo(
    () =>
      evidenceRows.flatMap((e) => {
        const sourceUrl = e.sourceUrl?.trim();
        if (sourceUrl === undefined || sourceUrl === "") return [];
        return [{ id: e.id, sourceUrl, label: e.label }];
      }),
    [evidenceRows]
  );

  const [filters, setFilters] = useState<JobQueueFilters>(EMPTY_JOB_FILTERS);
  const [runMode, setRunMode] = useState<RunMode>("cap");

  const queue = useMemo(
    () => sortJobQueue(filterJobQueue(jobs, filters, evidenceTitleById)),
    [jobs, filters, evidenceTitleById]
  );

  const ws = useJobsWorkspace(active.id, {
    jobId,
    onJobIdChange,
    caps,
    jobs,
    queue,
    jobsListFetching,
  });

  // Keep ?jobId= aligned with resolved selection via Navigate (not a sync effect).
  if (ws.selectionOutOfSync) {
    return (
      <Navigate
        to="/jobs"
        search={(prev) => ({
          ...prev,
          jobId: ws.selectedId ?? undefined,
        })}
        replace
      />
    );
  }

  let detail: ReactNode;
  if (jobs.length === 0) {
    detail = <div className="h-full" aria-hidden />;
  } else if (ws.selectedId !== null && !ws.detailJob) {
    detail = (
      <div className="flex h-full items-center justify-center p-6">
        <InlineLoading label="Fetching logs and artifacts…" />
      </div>
    );
  } else {
    detail = (
      <JobDetail
        job={ws.detailJob}
        evidenceTitleById={evidenceTitleById}
        runSiblings={ws.runSiblings}
        recipeTotal={
          ws.detailJob?.playbookId
            ? recipeStepCountByPlaybookId.get(ws.detailJob.playbookId)
            : undefined
        }
        busy={ws.cancelBusy}
        onCancel={ws.handleCancel}
        onCancelPlaybook={
          ws.hasPlaybookRun ? ws.handleCancelPlaybook : undefined
        }
        cancelPlaybookBusy={ws.cancelPlaybookBusy}
      />
    );
  }

  return (
    <>
      <PageHeader
        actions={<RunModeToggle value={runMode} onValueChange={setRunMode} />}
      />
      <JobQueueToolbar
        jobs={jobs}
        filters={filters}
        onFiltersChange={setFilters}
        runSlot={
          runMode === "playbook" ? (
            <JobPlaybookRunForm
              playbooks={playbooks}
              urlDumps={urlDumps}
              entities={entities}
              allowThirdPartyEgress={active.allowThirdPartyEgress}
              configuredCredentials={configuredCredentials}
              runError={ws.error}
              onRunPlaybook={ws.handleRunPlaybook}
            />
          ) : (
            <JobCapRunForm
              caps={caps}
              entities={entities}
              allowThirdPartyEgress={active.allowThirdPartyEgress}
              configuredCredentials={configuredCredentials}
              runError={ws.error}
              onRunCap={ws.handleRunCap}
            />
          )
        }
      />

      {ws.stuckJobs.length > 0 ? (
        <Alert variant="destructive" className="mx-4 mt-2">
          <AlertTitle>Worker may be down</AlertTitle>
          <AlertDescription>
            {ws.stuckJobs.length} job{ws.stuckJobs.length === 1 ? "" : "s"}{" "}
            queued or running for over 60s. Start the worker with{" "}
            <code className="font-mono text-xs">pnpm dev:worker</code>.
          </AlertDescription>
        </Alert>
      ) : null}

      <SplitView
        key="jobs-split"
        groupId="jobs"
        list={
          <QueueShell
            aria-label="Job queue"
            header={
              <QueueHeader
                label="Queue"
                count={
                  queue.length === jobs.length
                    ? jobs.length
                    : `${queue.length} / ${jobs.length}`
                }
              />
            }
          >
            <JobQueueBody
              hasAnyJobs={jobs.length > 0}
              queue={queue}
              selectedId={ws.selectedId}
              onSelect={(id) => {
                onJobIdChange(id);
              }}
              searchQuery={filters.q}
              onClearFilters={() => {
                setFilters(EMPTY_JOB_FILTERS);
              }}
              evidenceTitleById={evidenceTitleById}
              recipeStepCountByPlaybookId={recipeStepCountByPlaybookId}
            />
          </QueueShell>
        }
        detail={detail}
      />
    </>
  );
}

export function Jobs({
  jobId,
  onJobIdChange,
}: {
  jobId?: string;
  onJobIdChange: (next: string | null) => void;
}) {
  const queryClient = useQueryClient();
  const { data: casesCtx } = useSuspenseQuery(casesContextQuery());
  const { data: caps } = useSuspenseQuery(capabilitiesListQuery());
  const { data: playbooks } = useSuspenseQuery(playbooksListQuery());

  useEffect(() => bindCasesChangedInvalidation(queryClient), [queryClient]);

  if (!casesCtx.active) {
    return (
      <>
        <PageHeader />
        <EmptyState
          intent="blank-slate"
          items="cases"
          title="No Active Case"
          description={
            <>
              <Link to="/cases" className="underline">
                Select a Case
              </Link>{" "}
              to run jobs.
            </>
          }
        />
      </>
    );
  }

  return (
    <Suspense
      fallback={
        <>
          <PageHeader />
          <div
            className="min-h-0 flex-1 overflow-hidden"
            aria-busy
            aria-live="polite"
          >
            <QueueSkeleton rows={10} />
          </div>
        </>
      }
    >
      <JobsActive
        active={casesCtx.active}
        caps={caps}
        playbooks={playbooks}
        jobId={jobId}
        onJobIdChange={onJobIdChange}
      />
    </Suspense>
  );
}
