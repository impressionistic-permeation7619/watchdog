import type { JobListRecord } from "@/domains/jobs/jobs.functions";
import {
  JOB_STATUSES,
  isOpenJobStatus,
  type JobStatus,
  type PlaybookRunStatus,
} from "@watchdog/schemas";

export { JOB_STATUS_OPTIONS as STATUS_FACET_OPTIONS } from "@/shared/ui/vocab";

export interface JobQueueFilters {
  q: string;
  statuses: JobStatus[];
  capabilityIds: string[];
}

export const EMPTY_JOB_FILTERS: JobQueueFilters = {
  q: "",
  statuses: [],
  capabilityIds: [],
};

// ─── status meta ─────────────────────────────────────────────────────────────

export const CANCELABLE = new Set<JobStatus>(
  JOB_STATUSES.filter(
    (s) => s === "queued" || s === "running" || s === "blocked"
  )
);
export const LIVE_STATUSES = new Set<JobStatus>(
  JOB_STATUSES.filter((s) => s === "queued" || s === "running")
);

export function isLive(status: JobStatus): boolean {
  return LIVE_STATUSES.has(status);
}

// ─── display helpers ─────────────────────────────────────────────────────────

const INPUT_HINT_KEYS = [
  "host",
  "domain",
  "target",
  "query",
  "url",
  "name",
] as const;
const EVIDENCE_ID_KEYS = ["evidenceId", "sourceEvidenceId"] as const;
const SKIP_FALLBACK_KEYS = new Set<string>([
  ...EVIDENCE_ID_KEYS,
  "entityId",
  "caseId",
  "jobId",
]);

/**
 * Short human subject for a Job input.
 * Prefer host/url-style fields; resolve Evidence ids via `evidenceTitleById`
 * when provided (Process / Enrich). Never surface bare UUIDs as the hint.
 */
export function summarizeJobInput(
  input: Record<string, unknown>,
  evidenceTitleById?: ReadonlyMap<string, string>
): string {
  for (const key of INPUT_HINT_KEYS) {
    const value = input[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim();
    }
  }

  for (const key of EVIDENCE_ID_KEYS) {
    const id = input[key];
    if (typeof id !== "string" || id.trim() === "") continue;
    const title = evidenceTitleById?.get(id)?.trim();
    if (title !== undefined && title !== "") return title;
  }

  for (const [key, value] of Object.entries(input)) {
    if (SKIP_FALLBACK_KEYS.has(key)) continue;
    if (typeof value === "string" && value.trim() !== "") {
      return value.trim().slice(0, 40);
    }
  }
  return "";
}

// ─── filtering + sorting ─────────────────────────────────────────────────────

export function filterJobQueue(
  jobs: JobListRecord[],
  filters: JobQueueFilters,
  evidenceTitleById?: ReadonlyMap<string, string>
): JobListRecord[] {
  let out = jobs;
  if (filters.statuses.length > 0) {
    out = out.filter((j) => filters.statuses.includes(j.status));
  }
  if (filters.capabilityIds.length > 0) {
    out = out.filter((j) => filters.capabilityIds.includes(j.capabilityId));
  }
  if (filters.q.trim()) {
    const q = filters.q.toLowerCase().trim();
    out = out.filter(
      (j) =>
        j.capabilityId.toLowerCase().includes(q) ||
        j.id.toLowerCase().includes(q) ||
        (j.playbookId ?? "").toLowerCase().includes(q) ||
        summarizeJobInput(j.input, evidenceTitleById)
          .toLowerCase()
          .includes(q) ||
        (j.resultSummary ?? "").toLowerCase().includes(q)
    );
  }
  return out;
}

export function sortJobQueue(jobs: JobListRecord[]): JobListRecord[] {
  return [...jobs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/** Solo Cap Job or a playbook run cluster (steps ordered by playbookStep). */
export type JobQueueEntry =
  | { kind: "solo"; job: JobListRecord }
  | {
      kind: "playbook";
      runId: string;
      playbookId: string;
      playbookRunStatus: PlaybookRunStatus | null;
      steps: JobListRecord[];
    };

/**
 * Collapse playbook steps that share `playbookRunId` into one entry.
 * Preserves newest-first order of first sighting (solos + run heads).
 */
export function groupJobsForQueue(jobs: JobListRecord[]): JobQueueEntry[] {
  const seenRuns = new Set<string>();
  const entries: JobQueueEntry[] = [];

  for (const job of jobs) {
    const runId = job.playbookRunId;
    if (runId !== null && runId !== "") {
      if (seenRuns.has(runId)) continue;
      seenRuns.add(runId);
      const steps = jobs
        .filter((j) => j.playbookRunId === runId)
        .sort((a, b) => (a.playbookStep ?? 0) - (b.playbookStep ?? 0));
      entries.push({
        kind: "playbook",
        runId,
        playbookId: job.playbookId ?? "playbook",
        playbookRunStatus: job.playbookRunStatus,
        steps,
      });
      continue;
    }
    entries.push({ kind: "solo", job });
  }

  return entries;
}

/** Aggregate status for a playbook run (live > blocked > failed > …). */
function playbookRecipeDone(steps: readonly JobListRecord[]): number {
  const byStep = new Map<number, JobListRecord[]>();
  for (const step of steps) {
    const n = step.playbookStep ?? 0;
    const group = byStep.get(n) ?? [];
    group.push(step);
    byStep.set(n, group);
  }
  const ordered = [...byStep.keys()].sort((a, b) => a - b);
  let done = 0;
  for (const n of ordered) {
    const at = byStep.get(n) ?? [];
    if (at.some((j) => isOpenJobStatus(j.status))) {
      break;
    }
    done += 1;
  }
  return done;
}

function finishedPlaybookRunStatus(steps: readonly JobListRecord[]): JobStatus {
  if (steps.some((s) => s.status === "failed")) return "failed";
  if (steps.some((s) => s.status === "cancelled")) return "cancelled";
  return "succeeded";
}

const LIVE_STEP_STATUS_PRIORITY: JobStatus[] = [
  "running",
  "queued",
  "blocked",
  "failed",
  "cancelled",
];

function livePlaybookRunStatus(
  steps: readonly JobListRecord[],
  recipeTotal?: number
): JobStatus {
  const statuses = steps.map((s) => s.status);
  for (const status of LIVE_STEP_STATUS_PRIORITY) {
    if (statuses.some((s) => s === status)) return status;
  }
  const total = recipeTotal ?? steps.length;
  if (playbookRecipeDone(steps) < total) return "queued";
  if (statuses.length > 0 && statuses.every((s) => s === "succeeded")) {
    return "succeeded";
  }
  return statuses[0] ?? "queued";
}

export function playbookRunStatus(
  steps: readonly JobListRecord[],
  recipeTotal?: number,
  runStatus?: PlaybookRunStatus | null
): JobStatus {
  if (runStatus === "finished") return finishedPlaybookRunStatus(steps);
  if (runStatus === "cancelled") return "cancelled";
  return livePlaybookRunStatus(steps, recipeTotal);
}

export function playbookRunProgress(
  steps: readonly JobListRecord[],
  recipeTotal?: number,
  runStatus?: PlaybookRunStatus | null
): {
  done: number;
  total: number;
} {
  const total = recipeTotal ?? steps.length;
  if (runStatus === "finished" || runStatus === "cancelled") {
    return { done: total, total };
  }
  return { done: playbookRecipeDone(steps), total };
}

export function playbookWaitingOnNextStep(
  steps: readonly JobListRecord[],
  recipeTotal?: number,
  runStatus?: PlaybookRunStatus | null
): boolean {
  if (runStatus === "finished" || runStatus === "cancelled") return false;
  const { done, total } = playbookRunProgress(steps, recipeTotal, runStatus);
  return done < total && !steps.some((s) => isOpenJobStatus(s.status));
}

// ─── capability facets ───────────────────────────────────────────────────────

export function capabilityFacetOptions(
  jobs: JobListRecord[]
): { value: string; label: string }[] {
  const seen = new Set<string>();
  const out: { value: string; label: string }[] = [];
  for (const job of jobs) {
    if (!seen.has(job.capabilityId)) {
      seen.add(job.capabilityId);
      out.push({ value: job.capabilityId, label: job.capabilityId });
    }
  }
  return out;
}

export function formatDuration(
  startedAt: string | null,
  finishedAt: string | null
): string | null {
  if (startedAt === null || startedAt === "") return null;
  const end =
    finishedAt !== null && finishedAt !== ""
      ? new Date(finishedAt)
      : new Date();
  const ms = end.getTime() - new Date(startedAt).getTime();
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60_000)}m ${Math.floor((ms % 60_000) / 1000)}s`;
}
