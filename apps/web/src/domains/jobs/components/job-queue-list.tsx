import type { JobListRecord } from "@/domains/jobs/jobs.functions";
import {
  groupJobsForQueue,
  isLive,
  playbookRunProgress,
  playbookRunStatus,
  playbookWaitingOnNextStep,
  summarizeJobInput,
} from "@/domains/jobs/lib/status";
import { DetailStatusChip } from "@/shared/ui/detail-status-chip";
import { groupItemsByDay } from "@/shared/ui/group-by-day";
import { QueueDayGroup } from "@/shared/ui/queue-day-group";
import {
  QueueRow,
  QueueRowInstantMeta,
  QueueRowTitle,
} from "@/shared/ui/queue-row";
import { RelativeTime } from "@/shared/ui/relative-time";
import { StatusDot } from "@/shared/ui/status-dot";
import { capabilityLabel } from "@/shared/ui/vocab";
import { titleCase } from "@/shared/ui/vocab/title-case";
import type { PlaybookRunStatus } from "@watchdog/schemas";

interface JobQueueListProps {
  jobs: JobListRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  evidenceTitleById?: ReadonlyMap<string, string>;
  recipeStepCountByPlaybookId?: ReadonlyMap<string, number>;
}

function playbookLabel(playbookId: string): string {
  return titleCase(playbookId.replaceAll("-", " "));
}

function playbookStepChrome(
  stepN: number,
  job: JobListRecord,
  steps: JobListRecord[]
): string {
  const siblingCount = steps.filter(
    (s) => s.playbookStep === job.playbookStep
  ).length;
  if (siblingCount <= 1) return `${stepN}.`;
  return `${stepN} · ${(job.playbookFanIndex ?? 0) + 1}/${siblingCount}`;
}

function SoloJobRow({
  job,
  selected,
  onSelect,
  evidenceTitleById,
}: {
  job: JobListRecord;
  selected: boolean;
  onSelect: (id: string) => void;
  evidenceTitleById?: ReadonlyMap<string, string>;
}) {
  const live = isLive(job.status);
  const inputHint = summarizeJobInput(job.input, evidenceTitleById);

  return (
    <QueueRow
      role="option"
      aria-selected={selected}
      selected={selected}
      live={live}
      onClick={() => {
        onSelect(job.id);
      }}
      className="py-2"
      trailing={
        <StatusDot status={job.status} pulse={job.status === "running"} />
      }
    >
      <QueueRowTitle>{capabilityLabel(job.capabilityId)}</QueueRowTitle>
      {inputHint ? (
        <span className="text-foreground/70 truncate text-xs">{inputHint}</span>
      ) : null}
      <QueueRowInstantMeta value={job.createdAt} id={job.id} />
    </QueueRow>
  );
}

function PlaybookRunCluster({
  playbookId,
  steps,
  selectedId,
  onSelect,
  evidenceTitleById,
  recipeTotal,
  playbookRunStatus: runRowStatus,
}: {
  playbookId: string;
  steps: JobListRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  evidenceTitleById?: ReadonlyMap<string, string>;
  recipeTotal: number;
  playbookRunStatus: PlaybookRunStatus | null;
}) {
  const runStatus = playbookRunStatus(steps, recipeTotal, runRowStatus);
  const { done, total } = playbookRunProgress(steps, recipeTotal, runRowStatus);
  const runLive = isLive(runStatus);
  const waitingNext = playbookWaitingOnNextStep(
    steps,
    recipeTotal,
    runRowStatus
  );
  const selectedInRun =
    selectedId !== null && steps.some((s) => s.id === selectedId);
  let anchorAt = steps[0]?.createdAt ?? "";
  for (const step of steps) {
    if (Date.parse(step.createdAt) > Date.parse(anchorAt)) {
      anchorAt = step.createdAt;
    }
  }

  return (
    <div className={selectedInRun ? "bg-muted/30" : "bg-muted/15"}>
      <div className="flex w-full min-w-0 items-start gap-2 px-3 py-2">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <QueueRowTitle className="font-sans">
              {playbookLabel(playbookId)}
            </QueueRowTitle>
            <DetailStatusChip size="sm">playbook</DetailStatusChip>
          </div>
          <p className="text-muted-foreground text-xs tabular-nums">
            {done}/{total} step{total === 1 ? "" : "s"}
            {waitingNext || runStatus === "blocked" ? " · waiting" : null}
            {anchorAt === "" ? null : (
              <>
                <span aria-hidden> · </span>
                <RelativeTime value={anchorAt} />
              </>
            )}
          </p>
        </div>
        <StatusDot
          status={runStatus}
          pulse={runLive && runStatus === "running"}
        />
      </div>

      <ul className="border-border divide-border divide-y border-t">
        {steps.map((job) => {
          const selected = job.id === selectedId;
          const stepLive = isLive(job.status);
          const inputHint = summarizeJobInput(job.input, evidenceTitleById);
          const stepN = (job.playbookStep ?? 0) + 1;

          return (
            <li key={job.id}>
              <QueueRow
                role="option"
                aria-selected={selected}
                selected={selected}
                live={stepLive}
                onClick={() => {
                  onSelect(job.id);
                }}
                className="py-2 pl-6"
                trailing={
                  <StatusDot
                    status={job.status}
                    pulse={job.status === "running"}
                  />
                }
              >
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <span className="text-muted-foreground text-label-mono-sm tabular-nums">
                    {playbookStepChrome(stepN, job, steps)}
                  </span>
                  <QueueRowTitle>
                    {capabilityLabel(job.capabilityId)}
                  </QueueRowTitle>
                </div>
                {inputHint ? (
                  <span className="text-foreground/70 truncate text-xs">
                    {inputHint}
                  </span>
                ) : null}
                <QueueRowInstantMeta value={job.createdAt} id={job.id} />
              </QueueRow>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function JobQueueList({
  jobs,
  selectedId,
  onSelect,
  evidenceTitleById,
  recipeStepCountByPlaybookId,
}: JobQueueListProps) {
  const days = groupItemsByDay(jobs, (j) => j.createdAt);

  return (
    <div role="listbox" aria-label="Job runs">
      {days.map((day) => {
        const entries = groupJobsForQueue(day.items);
        return (
          <QueueDayGroup
            key={day.key}
            label={day.label}
            count={day.items.length}
          >
            {entries.map((entry) => {
              if (entry.kind === "solo") {
                return (
                  <li key={entry.job.id}>
                    <SoloJobRow
                      job={entry.job}
                      selected={entry.job.id === selectedId}
                      onSelect={onSelect}
                      evidenceTitleById={evidenceTitleById}
                    />
                  </li>
                );
              }

              return (
                <li key={entry.runId}>
                  <PlaybookRunCluster
                    playbookId={entry.playbookId}
                    steps={entry.steps}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    evidenceTitleById={evidenceTitleById}
                    recipeTotal={
                      recipeStepCountByPlaybookId?.get(entry.playbookId) ??
                      entry.steps.length
                    }
                    playbookRunStatus={entry.playbookRunStatus}
                  />
                </li>
              );
            })}
          </QueueDayGroup>
        );
      })}
    </div>
  );
}
