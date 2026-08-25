import { and, eq, gt } from "drizzle-orm";

import type { DbExec } from "../exec";
import { capCache } from "../schema/cap-cache";
import { jobs, type JobArtifact } from "../schema/jobs";

export type CapCacheRow = typeof capCache.$inferSelect;

export interface CapCacheLookup {
  artifacts: JobArtifact[];
  resultSummary: string | null;
  jobId: string | null;
  evidenceIds: string[];
}

export interface UpsertCapCacheValues {
  caseId: string;
  capabilityId: string;
  inputHash: string;
  jobId: string;
  artifacts: JobArtifact[];
  resultSummary: string | null;
  ttlMs: number;
  createdAt: Date;
  expiresAt: Date;
}

export const capCacheRepo = {
  async lookupActive(
    exec: DbExec,
    caseId: string,
    capabilityId: string,
    inputHash: string,
    now: Date
  ): Promise<CapCacheLookup | null> {
    const [row] = await exec
      .select({
        artifacts: capCache.artifacts,
        resultSummary: capCache.resultSummary,
        jobId: capCache.jobId,
        evidenceIds: jobs.evidenceIds,
      })
      .from(capCache)
      .leftJoin(jobs, eq(capCache.jobId, jobs.id))
      .where(
        and(
          eq(capCache.caseId, caseId),
          eq(capCache.capabilityId, capabilityId),
          eq(capCache.inputHash, inputHash),
          gt(capCache.expiresAt, now)
        )
      )
      .limit(1);
    if (!row) return null;
    // Missing Job (left join) or null evidence_ids → []; collect still
    // cache-hits artifacts, landEvidence creates Evidence from those blobs.
    return {
      artifacts: row.artifacts,
      resultSummary: row.resultSummary,
      jobId: row.jobId,
      evidenceIds: row.evidenceIds ?? [],
    };
  },

  async upsert(exec: DbExec, values: UpsertCapCacheValues): Promise<void> {
    await exec
      .insert(capCache)
      .values(values)
      .onConflictDoUpdate({
        target: [capCache.caseId, capCache.capabilityId, capCache.inputHash],
        set: {
          jobId: values.jobId,
          artifacts: values.artifacts,
          resultSummary: values.resultSummary,
          ttlMs: values.ttlMs,
          createdAt: values.createdAt,
          expiresAt: values.expiresAt,
        },
      });
  },
};
