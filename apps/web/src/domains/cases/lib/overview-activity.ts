import type { ProposalRecord } from "@/domains/inbox/inbox.functions";
import type { EvidenceRecord } from "@/domains/intake/types";
import type { JobListRecord } from "@/domains/jobs/jobs.functions";

export type ActivityKind = "evidence" | "job" | "proposal";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  label: string;
  at: string;
  href: { to: "/intake" | "/jobs" | "/inbox" };
}

const MAX_ACTIVITY = 12;

function displayText(
  value: string | null | undefined,
  fallback: string
): string {
  const trimmed = value?.trim();
  if (!trimmed) {
    return fallback;
  }
  return trimmed;
}

export function buildCaseOverviewActivity(
  evidence: EvidenceRecord[],
  jobs: JobListRecord[],
  pendingProposals: ProposalRecord[],
  maxItems = MAX_ACTIVITY
): ActivityItem[] {
  const items: ActivityItem[] = [];
  for (const e of evidence) {
    items.push({
      id: `ev-${e.id}`,
      kind: "evidence",
      label: displayText(e.label, e.kind),
      at: e.capturedAt,
      href: { to: "/intake" },
    });
  }
  for (const j of jobs) {
    items.push({
      id: `job-${j.id}`,
      kind: "job",
      label: displayText(j.resultSummary, j.capabilityId),
      at: j.updatedAt ?? j.createdAt,
      href: { to: "/jobs" },
    });
  }
  for (const p of pendingProposals) {
    items.push({
      id: `prop-${p.id}`,
      kind: "proposal",
      label: displayText(p.summary, "Proposal pending"),
      at: p.createdAt,
      href: { to: "/inbox" },
    });
  }
  items.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
  return items.slice(0, maxItems);
}
