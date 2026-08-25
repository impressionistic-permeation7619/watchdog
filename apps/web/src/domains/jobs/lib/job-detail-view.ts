import type { JobListRecord, JobRecord } from "@/domains/jobs/jobs.functions";
import {
  CANCELABLE,
  formatDuration,
  isLive,
  summarizeJobInput,
} from "@/domains/jobs/lib/status";

export type JobDetailTab = "log" | "input" | "output";

export interface JobDetailView {
  live: boolean;
  logs: string;
  duration: string | null;
  inputHint: string;
  outputCount: number;
  interpretFailed: boolean;
  canCancel: boolean;
  canCancelPlaybook: boolean;
  proposalId: string | null;
  showFooter: boolean;
  capSummary: string;
  showAllKnownOutcome: boolean;
  ranInstant: string;
  showPlaybookChip: boolean;
  showSucceededOutcomeChip: boolean;
}

export function buildJobDetailView(input: {
  job: JobRecord;
  playbookSteps: JobListRecord[] | null;
  evidenceTitleById?: ReadonlyMap<string, string>;
  onCancelPlaybook?: () => void;
}): JobDetailView {
  const { job, playbookSteps, evidenceTitleById, onCancelPlaybook } = input;
  const interpretFailed = Boolean(job.interpretError);
  const canCancel = CANCELABLE.has(job.status);
  const canCancelPlaybook =
    job.playbookRunId !== null &&
    job.playbookRunId !== "" &&
    onCancelPlaybook !== undefined;
  const proposalId =
    job.proposalId !== null && job.proposalId !== "" ? job.proposalId : null;
  const duration = formatDuration(job.startedAt, job.finishedAt);

  return {
    live: isLive(job.status),
    logs: (job.logs ?? []).join("\n").trim(),
    duration,
    inputHint: summarizeJobInput(job.input, evidenceTitleById),
    outputCount: job.output?.length ?? 0,
    interpretFailed,
    canCancel,
    canCancelPlaybook,
    proposalId,
    showFooter: proposalId !== null || canCancel || canCancelPlaybook,
    capSummary:
      job.resultSummary !== null && job.resultSummary !== ""
        ? job.resultSummary
        : "",
    showAllKnownOutcome:
      job.status === "succeeded" &&
      !interpretFailed &&
      proposalId === null &&
      job.suppressedCount > 0,
    ranInstant:
      job.startedAt !== null && job.startedAt !== ""
        ? job.startedAt
        : job.createdAt,
    showPlaybookChip: playbookSteps !== null,
    showSucceededOutcomeChip:
      job.status === "succeeded" && !interpretFailed && proposalId === null,
  };
}
