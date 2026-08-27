import { rm } from "node:fs/promises";

import { db, jobsRepo, type JobRow } from "@watchdog/db";

import { logSwallowed } from "../infra/process-log";
import {
  getActiveJobAbortSignal,
  unregisterActiveJobController,
} from "./job-cancel-registry";
import { runFailedPath, runSucceededPath } from "./run-paths";
import { advancePlaybookRun } from "./stages/chain";
import { collect, type CollectResult } from "./stages/collect";
import { finish } from "./stages/finish";
import { createJobLog, type JobLog } from "./stages/helpers";
import {
  interpretStage,
  logInterpretFailure,
  type InterpretStageResult,
} from "./stages/interpret";
import { landEvidence } from "./stages/land-evidence";
import {
  preflight,
  type PreflightState,
  type PreflightStopReason,
} from "./stages/preflight";
import { proposeStage } from "./stages/propose";
import { suppressStage } from "./stages/suppress";

export {
  abortActiveJob,
  listActiveJobIds,
  registerActiveJobController,
  unregisterActiveJobController,
  type ActiveJobAbortReason,
} from "./job-cancel-registry";

export type JobAbortReason = "timeout" | "cancel";

export type JobRunOutcomeName =
  | "succeeded"
  | "failed"
  | "cancelled"
  | "stopped";

export interface JobRunOutcome {
  outcome: JobRunOutcomeName;
  stopReason?: PreflightStopReason;
  abortReason?: JobAbortReason;
  fromCache?: boolean;
  reclaim?: boolean;
  durationMs: number;
  caseId?: string;
  capabilityId?: string;
  playbookRunId?: string | null;
}

function abortReasonFromSignal(
  signal: AbortSignal | undefined
): JobAbortReason | undefined {
  const reason: unknown = signal?.reason;
  if (reason === "timeout" || reason === "cancel") return reason;
  return undefined;
}

function classifyRun(input: {
  finishOutcome?: "succeeded" | "cancelled";
  signal?: AbortSignal;
  threw: boolean;
}): { outcome: JobRunOutcomeName; abortReason?: JobAbortReason } {
  const abortReason = abortReasonFromSignal(input.signal);
  if (input.finishOutcome === "cancelled") {
    return { outcome: "cancelled", abortReason: abortReason ?? "cancel" };
  }
  if (input.threw) {
    return {
      outcome: abortReason === "cancel" ? "cancelled" : "failed",
      abortReason,
    };
  }
  return { outcome: "succeeded", abortReason };
}

/** Align wide-event outcome with product Job status after a preflight stop. */
function outcomeFromStopStatus(
  status: JobRow["status"] | undefined
): JobRunOutcomeName {
  switch (status) {
    case "failed": {
      return "failed";
    }
    case "succeeded": {
      return "succeeded";
    }
    case "cancelled": {
      return "cancelled";
    }
    case "queued":
    case "running":
    case "blocked":
    case undefined: {
      return "stopped";
    }
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

async function handlePreflightStop(
  jobId: string,
  reason: PreflightStopReason,
  started: number
): Promise<JobRunOutcome> {
  const row = await jobsRepo.get(db, jobId);
  if (row?.status === "failed" && row.playbookRunId !== null) {
    await advancePlaybookRun({
      playbookRunId: row.playbookRunId,
      caseId: row.caseId,
    }).catch((abandonError: unknown) => {
      logSwallowed("playbook.abandon", abandonError, { jobId });
    });
  }
  return {
    outcome: outcomeFromStopStatus(row?.status),
    stopReason: reason,
    durationMs: Date.now() - started,
    caseId: row?.caseId,
    capabilityId: row?.capabilityId,
    playbookRunId: row?.playbookRunId ?? null,
  };
}

async function cleanupCollectedRun(
  jobId: string,
  collected: CollectResult | undefined
): Promise<void> {
  if (!collected) return;
  clearTimeout(collected.runtime.timer);
  await rm(collected.runtime.scratchDir, {
    recursive: true,
    force: true,
  }).catch((cleanupError: unknown) => {
    logSwallowed("job.scratch_cleanup", cleanupError, { jobId });
  });
}

interface ProposePipelineResult {
  proposalId: string | null;
  suppressedCount: number;
  interpreted: InterpretStageResult;
}

async function proposeFromInterpret(
  state: PreflightState,
  interpreted: InterpretStageResult,
  attachEvidenceIds: string[],
  jobLog: JobLog,
  proposalId: string | null,
  suppressedCount: number
): Promise<ProposePipelineResult> {
  if (
    interpreted.interpretError !== null ||
    interpreted.patch.length === 0 ||
    proposalId !== null
  ) {
    return { proposalId, suppressedCount, interpreted };
  }

  const { kept, suppressed } = await suppressStage(
    state.job.caseId,
    interpreted.patch,
    jobLog
  );
  const proposed = await proposeStage({
    caseId: state.job.caseId,
    jobId: state.jobId,
    kept,
    suppressed,
    resultSummary: interpreted.resultSummary,
    attachEvidenceIds,
  });
  return {
    proposalId: proposed.proposalId,
    suppressedCount: proposed.suppressedCount,
    interpreted: {
      ...interpreted,
      resultSummary: proposed.resultSummary,
    },
  };
}

function finalizeResultSummary(
  interpreted: InterpretStageResult,
  collected: CollectResult,
  jobLog: JobLog
): string | null {
  let resultSummary = interpreted.resultSummary;
  if (interpreted.interpretError !== null) {
    resultSummary = logInterpretFailure(
      jobLog,
      interpreted.interpretError,
      resultSummary
    );
  }
  if (collected.fromCache && (resultSummary === null || resultSummary === "")) {
    return "Reused prior Cap artifacts";
  }
  return resultSummary;
}

async function runReadyJob(
  jobId: string,
  state: PreflightState,
  started: number
): Promise<JobRunOutcome> {
  const jobLog = createJobLog(state.job.logs ?? []);
  let collected: CollectResult | undefined;
  let runOutcome: JobRunOutcomeName = "succeeded";
  let abortReason: JobAbortReason | undefined;
  let fromCache: boolean | undefined;
  let reclaim: boolean | undefined;

  try {
    collected = await collect(state, jobLog);
    fromCache = collected.fromCache;
    reclaim = collected.reclaim;

    const attachEvidenceIds = await landEvidence(state, collected);

    let proposalId: string | null = state.job.proposalId ?? null;
    let suppressedCount = state.job.suppressedCount;
    let interpreted = await interpretStage(
      state,
      collected.artifacts,
      collected.runtime,
      {
        proposalId,
        resultSummary: state.job.resultSummary ?? null,
      }
    );

    const proposed = await proposeFromInterpret(
      state,
      interpreted,
      attachEvidenceIds,
      jobLog,
      proposalId,
      suppressedCount
    );
    proposalId = proposed.proposalId;
    suppressedCount = proposed.suppressedCount;
    interpreted = proposed.interpreted;

    const resultSummary = finalizeResultSummary(interpreted, collected, jobLog);

    const finishOutcome = await finish({
      state,
      jobLog,
      proposalId,
      resultSummary,
      fromCache: collected.fromCache,
      suppressedCount,
      interpretError: interpreted.interpretError,
      markSourceProcessed: interpreted.markSourceProcessed,
      handoff: interpreted.handoff,
    });

    const classified = classifyRun({
      finishOutcome,
      signal: collected.runtime.controller.signal,
      threw: false,
    });
    runOutcome = classified.outcome;
    abortReason = classified.abortReason;

    if (finishOutcome === "succeeded") {
      await runSucceededPath({
        jobId,
        state,
        collected,
        resultSummary,
        interpretError: interpreted.interpretError,
        jobLog,
      });
    }
  } catch (error: unknown) {
    const signal =
      collected?.runtime.controller.signal ?? getActiveJobAbortSignal(jobId);
    const classified = classifyRun({ signal, threw: true });
    abortReason = classified.abortReason;
    runOutcome = classified.outcome;

    await runFailedPath({
      jobId,
      error,
      jobLog,
      playbookRunId: state.job.playbookRunId,
      caseId: state.job.caseId,
    });
  } finally {
    await cleanupCollectedRun(jobId, collected);
    unregisterActiveJobController(jobId);
  }

  return {
    outcome: runOutcome,
    abortReason,
    fromCache,
    reclaim,
    durationMs: Date.now() - started,
    caseId: state.job.caseId,
    capabilityId: state.job.capabilityId,
    playbookRunId: state.job.playbookRunId ?? null,
  };
}

/**
 * Cap Job orchestrator — preflight → collect → land-evidence → interpret →
 * suppress → propose → finish → cache.
 */
export async function executeJob(jobId: string): Promise<JobRunOutcome> {
  const started = Date.now();
  const ready = await preflight(jobId);
  if (ready.kind === "stop") {
    return handlePreflightStop(jobId, ready.reason, started);
  }
  return runReadyJob(jobId, ready.state, started);
}
