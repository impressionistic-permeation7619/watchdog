import { db, evidenceRepo, jobsRepo } from "@watchdog/db";
import { isJobInternalArtifact } from "@watchdog/schemas";

import type { CollectResult } from "./collect";
import { inputString } from "./helpers";
import type { PreflightState } from "./preflight";

/**
 * Persist Cap artifacts as Evidence (skip Job-internal names) and link source dump.
 * Reclaim always reuses stored ids. Cache hits reuse ids when the source Job
 * still has them; otherwise land from cached artifacts (deleted Job / null ids).
 */
export async function landEvidence(
  state: PreflightState,
  collected: CollectResult
): Promise<string[]> {
  if (collected.reclaim) {
    return collected.evidenceIds;
  }
  if (collected.fromCache && collected.evidenceIds.length > 0) {
    return collected.evidenceIds;
  }

  const entityId = inputString(state.input, "entityId");

  return db.transaction(async (tx) => {
    let evidenceIds: string[] = [];

    for (const art of collected.artifacts) {
      if (isJobInternalArtifact(art.name)) continue;
      const kind =
        art.mime?.startsWith("text/html") || art.mime === "application/pdf"
          ? "url_archive"
          : "file";
      // oxlint-disable-next-line no-await-in-loop -- same-tx inserts share one connection
      const row = await evidenceRepo.create(tx, {
        caseId: state.job.caseId,
        entityId: entityId ?? null,
        kind,
        label: art.name,
        mime: art.mime,
        uri: art.uri,
        sha256: art.sha256,
        actorId: state.job.actorId,
      });
      if (row) evidenceIds.push(row.id);
    }

    const linkedSource = collected.runtime.linkedSource;
    if (linkedSource !== undefined && linkedSource !== "") {
      evidenceIds = [...new Set([...evidenceIds, linkedSource])];
    }

    await jobsRepo.update(tx, state.jobId, {
      output: collected.artifacts,
      evidenceIds,
      logs: collected.runtime.jobLog.lines,
    });

    return evidenceIds;
  });
}
