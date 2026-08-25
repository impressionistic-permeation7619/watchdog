import type { EvidenceRecord } from "@/domains/intake/types";
import type { JobListRecord } from "@/domains/jobs/jobs.functions";
import { capabilityLabel } from "@/shared/ui/vocab";
import {
  ENRICHED_MD_ARTIFACT,
  isProcessCapability,
  URL_ENRICH_CAPABILITY_ID,
} from "@watchdog/schemas";

export { ENRICHED_MD_ARTIFACT };

export function evidenceTitle(row: EvidenceRecord): string {
  const label = row.label?.trim();
  if (label !== undefined && label !== "") return label;
  if (row.sourceUrl !== null && row.sourceUrl !== "") {
    try {
      return new URL(row.sourceUrl).hostname;
    } catch {
      return row.sourceUrl;
    }
  }
  return row.kind;
}

/**
 * Collect Cap that landed this row as Evidence (not Process/Enrich linking).
 * Infer from Job.evidenceIds — no sourceJobId column Day-0.
 */
export function producingCapJob(
  jobs: JobListRecord[],
  evidenceId: string
): JobListRecord | null {
  const matches = jobs
    .filter((job) => {
      if (isProcessCapability(job.capabilityId)) return false;
      if (job.capabilityId === URL_ENRICH_CAPABILITY_ID) return false;
      return job.evidenceIds?.includes(evidenceId) === true;
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return matches[0] ?? null;
}

export function evidenceHint(
  row: EvidenceRecord,
  producingCap: JobListRecord | null = null
): string | null {
  if (row.sourceUrl !== null && row.sourceUrl !== "") return row.sourceUrl;
  if (producingCap !== null) {
    return capabilityLabel(producingCap.capabilityId);
  }
  if (row.text !== null && row.text.length > 0) {
    return `${row.text.length.toLocaleString()} characters`;
  }
  return null;
}

export function processJobsForEvidence(
  jobs: JobListRecord[],
  evidenceId: string
): JobListRecord[] {
  return jobs
    .filter((job) => {
      if (!isProcessCapability(job.capabilityId)) return false;
      if (job.evidenceIds?.includes(evidenceId) === true) return true;
      const inputId = job.input.evidenceId;
      return typeof inputId === "string" && inputId === evidenceId;
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function enrichJobsForEvidence(
  jobs: JobListRecord[],
  evidenceId: string
): JobListRecord[] {
  return jobs
    .filter((job) => {
      if (job.capabilityId !== URL_ENRICH_CAPABILITY_ID) return false;
      if (job.evidenceIds?.includes(evidenceId) === true) return true;
      const sourceId = job.input.sourceEvidenceId;
      return typeof sourceId === "string" && sourceId === evidenceId;
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

/** Prefer succeeded enrich Job’s enriched.md for the Intake Output tab. */
export function latestEnrichOutput(
  jobs: JobListRecord[],
  evidenceId: string
): {
  job: JobListRecord;
  artifact: NonNullable<JobListRecord["output"]>[number];
} | null {
  for (const job of enrichJobsForEvidence(jobs, evidenceId)) {
    const arts = job.output ?? [];
    const enriched =
      arts.find((a) => a.name === ENRICHED_MD_ARTIFACT) ??
      arts.find((a) => a.name === "live.md") ??
      arts.find((a) => a.name === "wayback.md");
    if (enriched && job.status === "succeeded") {
      return { job, artifact: enriched };
    }
  }
  const running = enrichJobsForEvidence(jobs, evidenceId).find(
    (j) => j.status === "queued" || j.status === "running"
  );
  if (running) return null;
  return null;
}

export function evidenceHasEnrichableUrl(row: EvidenceRecord): boolean {
  const url = (row.sourceUrl ?? row.text)?.trim();
  return url !== undefined && url !== "" && /^https?:\/\//i.test(url);
}
