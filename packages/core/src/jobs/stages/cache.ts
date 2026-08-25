import type { JobArtifact } from "@watchdog/db";

import { storeCapCache } from "../cap-cache";
import type { CollectRuntime } from "./collect";
import type { PreflightState } from "./preflight";

/** Persist Cap result for future cache hits (act Caps / errors / reclaim skip). */
export async function storeCacheStage(input: {
  state: PreflightState;
  runtime: CollectRuntime;
  artifacts: JobArtifact[];
  resultSummary: string | null;
  fromCache: boolean;
  reclaim: boolean;
  interpretError: string | null;
}): Promise<void> {
  const { runtime, state } = input;
  if (
    runtime.cacheTtlMs === null ||
    runtime.inputHash === null ||
    input.fromCache ||
    input.reclaim ||
    input.interpretError !== null
  ) {
    return;
  }

  await storeCapCache({
    caseId: state.job.caseId,
    capabilityId: state.cap.id,
    inputHash: runtime.inputHash,
    jobId: state.jobId,
    artifacts: input.artifacts,
    resultSummary: input.resultSummary,
    ttlMs: runtime.cacheTtlMs,
  });
  runtime.jobLog.log(`cache stored (ttl=${runtime.cacheTtlMs}ms)`);
}
