import type { JobArtifact, JobHandoff } from "@watchdog/db";
import type { PatchOp } from "@watchdog/schemas";

import { tryParsePatch } from "../../graph/patch";
import { readArtifactBytes } from "../../infra/blob";
import { errorMessage } from "../../infra/domain-error";
import { loadCapReport } from "../load-cap-report";
import type { CollectRuntime } from "./collect";
import type { JobLog } from "./helpers";
import type { PreflightState } from "./preflight";

export interface InterpretStageResult {
  resultSummary: string | null;
  markSourceProcessed: boolean | undefined;
  interpretError: string | null;
  /** Valid patch ops ready for suppress/propose; empty if none / error. */
  patch: PatchOp[];
  handoff?: JobHandoff;
}

/**
 * Load Cap report and run pure interpret → parse PatchOp[].
 * Handoff is computed here but persisted on the success write.
 */
export async function interpretStage(
  state: PreflightState,
  artifacts: JobArtifact[],
  runtime: CollectRuntime,
  existing: {
    proposalId: string | null;
    resultSummary: string | null;
  }
): Promise<InterpretStageResult> {
  let resultSummary = existing.resultSummary;
  let markSourceProcessed: boolean | undefined;
  let interpretError: string | null = null;
  let patch: PatchOp[] = [];
  let handoff: JobHandoff | undefined;

  const interpretFn = state.cap.interpret;
  const skipInterpret = existing.proposalId !== null || !interpretFn;
  const needsReport = state.cap.handoff !== undefined || !skipInterpret;

  if (!needsReport) {
    return {
      resultSummary,
      markSourceProcessed,
      interpretError,
      patch,
    };
  }

  try {
    const loaded = await loadCapReport(artifacts, readArtifactBytes);
    if (loaded && state.cap.handoff) {
      handoff = state.cap.handoff(loaded.report);
    }
    if (skipInterpret) {
      return {
        resultSummary,
        markSourceProcessed,
        interpretError,
        patch,
        handoff,
      };
    }
    if (!loaded) {
      throw new Error("No report.json artifact to interpret");
    }
    const interpreted = await interpretFn(loaded.report, {
      input: state.input,
      ...(runtime.evidenceSnapshot?.entityId !== undefined &&
      runtime.evidenceSnapshot.entityId !== ""
        ? { snapshotEntityId: runtime.evidenceSnapshot.entityId }
        : {}),
      ...(runtime.evidenceSnapshot
        ? { snapshotTextChars: runtime.evidenceSnapshot.text.length }
        : {}),
    });
    resultSummary = interpreted.summary ?? null;
    markSourceProcessed = interpreted.markSourceProcessed;
    const parsedPatch = tryParsePatch(interpreted.patch);
    if (parsedPatch.ok) {
      patch = parsedPatch.patch;
    } else {
      interpretError = `interpret patch invalid: ${parsedPatch.error}`;
    }
  } catch (error) {
    interpretError = errorMessage(error);
  }

  return {
    resultSummary,
    markSourceProcessed,
    interpretError,
    patch,
    handoff,
  };
}

export function logInterpretFailure(
  jobLog: JobLog,
  interpretError: string,
  resultSummary: string | null
): string | null {
  jobLog.log(`interpret failed: ${interpretError}`);
  return (
    resultSummary ??
    "Evidence captured; interpretation failed — no Proposal created"
  );
}
