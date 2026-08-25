import {
  activityEventsRepo,
  activityRepo,
  db,
  type RecentActivityEventRow,
} from "@watchdog/db";
import type { ActivityItem, ActivityKind, JobStatus } from "@watchdog/schemas";

export type { ActivityItem, ActivityKind };

export interface ListRecentActivityOpts {
  caseId?: string;
  limit?: number;
}

const DEFAULT_LIMIT = 15;

function displayText(
  value: string | null | undefined,
  fallback: string
): string {
  const trimmed = value?.trim();
  if (trimmed === undefined || trimmed === "") {
    return fallback;
  }
  return trimmed;
}

/** Map stored task event codes → display verb. */
export function taskEventAction(
  action: string,
  toValue: string | null
): string {
  if (action === "created") return "Created";
  if (action === "deleted") return "Deleted";
  if (action === "status_changed") {
    if (toValue === "done") return "Completed";
    if (toValue === "dropped") return "Dropped";
    return "Moved";
  }
  return "Updated";
}

/** Derive a verb from job lifecycle status. */
export function jobActivityAction(status: JobStatus): string {
  switch (status) {
    case "succeeded": {
      return "Succeeded";
    }
    case "failed": {
      return "Failed";
    }
    case "cancelled": {
      return "Cancelled";
    }
    case "running": {
      return "Running";
    }
    case "blocked": {
      return "Blocked";
    }
    case "queued": {
      return "Queued";
    }
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function mapTaskEvent(row: RecentActivityEventRow): ActivityItem {
  return {
    id: row.id,
    kind: "task",
    action: taskEventAction(row.action, row.toValue),
    caseId: row.caseId,
    caseName: row.caseName,
    label: row.label,
    status: row.toValue ?? undefined,
    fromStatus: row.fromValue ?? undefined,
    toStatus: row.toValue ?? undefined,
    at: row.at.toISOString(),
  };
}

/** Pure merge/sort for unit tests — newer `at` first. */
export function mergeActivityItems(
  items: ActivityItem[],
  limit: number
): ActivityItem[] {
  return [...items]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .slice(0, limit);
}

export async function listRecentActivity(
  opts?: ListRecentActivityOpts
): Promise<ActivityItem[]> {
  const limit = opts?.limit ?? DEFAULT_LIMIT;
  const repoOpts = { caseId: opts?.caseId, limit };

  const [evidenceRows, jobRows, proposalRows, taskEvents] = await Promise.all([
    activityRepo.recentEvidence(db, repoOpts),
    activityRepo.recentJobs(db, repoOpts),
    activityRepo.recentPendingProposals(db, repoOpts),
    activityEventsRepo.recent(db, { ...repoOpts, kind: "task" }),
  ]);

  const items: ActivityItem[] = [
    ...evidenceRows.map((row) => ({
      id: row.id,
      kind: "evidence" as const,
      action: "Captured",
      caseId: row.caseId,
      caseName: row.caseName,
      label: displayText(row.label, row.kind),
      at: row.at.toISOString(),
    })),
    ...jobRows.map((row) => ({
      id: row.id,
      kind: "job" as const,
      action: jobActivityAction(row.status),
      caseId: row.caseId,
      caseName: row.caseName,
      label: displayText(row.resultSummary, row.capabilityId),
      status: row.status,
      at: row.at.toISOString(),
    })),
    ...proposalRows.map((row) => ({
      id: row.id,
      kind: "proposal" as const,
      action: "Pending",
      caseId: row.caseId,
      caseName: row.caseName,
      label: displayText(row.summary, "Proposal pending"),
      status: "pending",
      at: row.at.toISOString(),
    })),
    ...taskEvents.map(mapTaskEvent),
  ];

  return mergeActivityItems(items, limit);
}
