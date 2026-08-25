import { db, jobsRepo, type JobPatch, type JobRow } from "@watchdog/db";
import type { JobStatus } from "@watchdog/schemas";

import { notifyEvent } from "../infra/events";

/**
 * Persist Job status (+ related fields). Returns the updated row, or null when
 * the update matched no row (e.g. already cancelled with unlessCancelled).
 * Optional SSE notify after a successful write.
 */
export async function setJobStatus(
  jobId: string,
  patch: JobPatch & { status: JobStatus },
  opts?: {
    unlessCancelled?: boolean;
    onlyStatuses?: JobStatus[];
    notify?: boolean;
    caseId?: string;
  }
): Promise<JobRow | null> {
  const updated = await jobsRepo.update(
    db,
    jobId,
    { ...patch, updatedAt: patch.updatedAt ?? new Date() },
    {
      unlessCancelled: opts?.unlessCancelled,
      onlyStatuses: opts?.onlyStatuses,
    }
  );

  if (updated && opts?.notify === true) {
    const caseId = opts.caseId ?? updated.caseId;
    void (async () => {
      try {
        await notifyEvent({
          type: "job_update",
          caseId,
          jobId,
          status: patch.status,
        });
      } catch {
        /* empty */
      }
    })();
  }

  return updated;
}
