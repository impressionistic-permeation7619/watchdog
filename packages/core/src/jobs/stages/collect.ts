import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { capTimeoutMs, type CapContext } from "@watchdog/cap-sdk";
import { db, jobsRepo, type JobArtifact } from "@watchdog/db";
import type { EvidenceSnapshot } from "@watchdog/schemas";

import { packEvidenceSnapshot } from "../../evidence/pack-evidence-snapshot";
import { readArtifactBytes, uploadArtifact } from "../../infra/blob";
import { logSwallowed } from "../../infra/process-log";
import { getCredential, hasCredential } from "../../infra/vault";
import { hashCapInput, lookupCapCache } from "../cap-cache";
import { artifactsHaveCapReport } from "../load-cap-report";
import { registerActiveJobController } from "../job-cancel-registry";
import { inputString, linkedEvidenceId, type JobLog } from "./helpers";
import type { PreflightState } from "./preflight";

export interface CollectRuntime {
  scratchDir: string;
  controller: AbortController;
  timer: ReturnType<typeof setTimeout>;
  jobLog: JobLog;
  evidenceSnapshot: EvidenceSnapshot | undefined;
  linkedSource: string | undefined;
  cacheTtlMs: number | null;
  inputHash: string | null;
}

export interface CollectResult {
  artifacts: JobArtifact[];
  /** Evidence ids already known (reclaim / cache); land-evidence skipped when set. */
  evidenceIds: string[];
  fromCache: boolean;
  reclaim: boolean;
  runtime: CollectRuntime;
}

async function packSnapshotIfNeeded(
  state: PreflightState,
  jobLog: JobLog
): Promise<EvidenceSnapshot | undefined> {
  if (state.policy.needsEvidenceSnapshot !== true) return undefined;
  const evidenceId = inputString(state.input, "evidenceId");
  if (evidenceId === undefined || evidenceId === "") {
    throw new Error(
      "jobPolicy.needsEvidenceSnapshot requires input.evidenceId"
    );
  }
  const entityId = inputString(state.input, "entityId");
  const snapshot = await packEvidenceSnapshot({
    caseId: state.job.caseId,
    evidenceId,
    ...(entityId !== undefined && entityId !== "" ? { entityId } : {}),
  });
  jobLog.log(`packed EvidenceSnapshot (${snapshot.text.length} chars)`);
  return snapshot;
}

function buildCapContext(
  state: PreflightState,
  runtime: CollectRuntime
): CapContext<unknown> {
  const { job, input, allowThirdPartyEgress } = state;
  return {
    input,
    caseId: job.caseId,
    jobId: state.jobId,
    signal: runtime.controller.signal,
    scratchDir: runtime.scratchDir,
    log: runtime.jobLog.log,
    allowThirdPartyEgress,
    ...(runtime.evidenceSnapshot
      ? { evidenceSnapshot: runtime.evidenceSnapshot }
      : {}),
    async getCredential(name: string): Promise<string> {
      return getCredential(job.actorId, name);
    },
    async hasCredential(name: string): Promise<boolean> {
      return hasCredential(job.actorId, name);
    },
    async uploadArtifact(uploadInput: {
      bytes: Uint8Array;
      mime: string;
      name?: string;
    }) {
      const uploaded = await uploadArtifact({
        caseId: job.caseId,
        bytes: uploadInput.bytes,
        mime: uploadInput.mime,
        name: uploadInput.name,
      });
      return {
        name: uploadInput.name ?? "artifact",
        mime: uploaded.mime,
        uri: uploaded.uri,
        sha256: uploaded.sha256,
      };
    },
    async readArtifact(uri: string) {
      return readArtifactBytes(uri);
    },
  };
}

/**
 * Pack snapshot, prepare scratch/timeout, then reclaim / cache-hit / Cap.run.
 * Does not insert Evidence rows (see land-evidence).
 * Caller owns `jobLog` so failures still retain lines for failJob.
 */
export async function collect(
  state: PreflightState,
  jobLog: JobLog
): Promise<CollectResult> {
  const evidenceSnapshot = await packSnapshotIfNeeded(state, jobLog);
  const linkedSource = linkedEvidenceId(
    state.input,
    state.policy.linkEvidenceFromInput
  );
  const cacheTtlMs =
    state.cap.kind !== "act" &&
    state.policy.cacheTtlMs !== undefined &&
    state.policy.cacheTtlMs > 0
      ? state.policy.cacheTtlMs
      : null;
  const inputHash = cacheTtlMs === null ? null : hashCapInput(state.input);

  const scratchDir = await mkdtemp(path.join(tmpdir(), "wd-cap-"));
  const controller = new AbortController();
  registerActiveJobController(state.jobId, controller);
  const timeoutMs = capTimeoutMs(state.cap);
  const timer = setTimeout(() => {
    controller.abort("timeout");
  }, timeoutMs);

  const runtime: CollectRuntime = {
    scratchDir,
    controller,
    timer,
    jobLog,
    evidenceSnapshot,
    linkedSource,
    cacheTtlMs,
    inputHash,
  };

  try {
    if (state.reclaimArtifacts) {
      jobLog.log("reclaim: reusing existing Job artifacts");
      return {
        artifacts: state.reclaimArtifacts,
        evidenceIds: [...state.reclaimEvidenceIds],
        fromCache: false,
        reclaim: true,
        runtime,
      };
    }

    let fromCache = false;
    let artifacts: JobArtifact[] = [];
    let evidenceIds: string[] = [];

    if (cacheTtlMs !== null && inputHash !== null) {
      const hit = await lookupCapCache({
        caseId: state.job.caseId,
        capabilityId: state.cap.id,
        inputHash,
      });
      if (hit) {
        if (state.cap.interpret && !artifactsHaveCapReport(hit.artifacts)) {
          jobLog.log(
            "cache hit skipped — artifacts missing report.json (stale cache)"
          );
        } else {
          fromCache = true;
          artifacts = hit.artifacts;
          evidenceIds = [...(hit.evidenceIds ?? [])];
          jobLog.log(
            `cache hit (ttl=${cacheTtlMs}ms) — reusing artifacts from prior Job${
              hit.jobId === null ? "" : ` ${hit.jobId}`
            }`
          );
          await jobsRepo.update(db, state.jobId, {
            output: artifacts,
            evidenceIds,
            logs: jobLog.lines,
            updatedAt: new Date(),
          });
        }
      }
    }

    if (!fromCache) {
      const ctx = buildCapContext(state, runtime);
      const runResult = await state.cap.run(ctx);
      artifacts = runResult.artifacts;
    }

    return {
      artifacts,
      evidenceIds,
      fromCache,
      reclaim: false,
      runtime,
    };
  } catch (error) {
    // Leave registry entry until executeJob finally unregisters (abortReason read).
    clearTimeout(timer);
    await rm(scratchDir, { recursive: true, force: true }).catch(
      (cleanupError: unknown) => {
        logSwallowed("collect.scratch_cleanup", cleanupError, {
          jobId: state.jobId,
        });
      }
    );
    throw error;
  }
}
