import type { JobHandoff } from "@watchdog/db";

import { markEvidenceProcessed } from "../../evidence/process-evidence";
import { notifyEvent } from "../../infra/events";
import { setJobStatus } from "../set-job-status";
import { inputString, type JobLog } from "./helpers";
import type { PreflightState } from "./preflight";

type FinishInput = {
  state: PreflightState;
  jobLog: JobLog;
  proposalId: string | null;
  resultSummary: string | null;
  fromCache: boolean;
  suppressedCount: number;
  interpretError: string | null;
  markSourceProcessed: boolean | undefined;
  handoff?: JobHandoff;
};

/**
 * Persist terminal Job outcome (succeeded write, or skip if cancelled),
 * notify, optionally stamp source Evidence processed.
 */
export async function finish(input: FinishInput): Promise<"succeeded" | "cancelled"> {
  const { state, jobLog } = input;

  const finished = await setJobStatus(
    state.jobId,
    {
      status: "succeeded",
      proposalId: input.proposalId,
      resultSummary: input.resultSummary,
      fromCache: input.fromCache,
      suppressedCount: input.suppressedCount,
      error: null,
      interpretError: input.interpretError,
      logs: jobLog.lines,
      finishedAt: new Date(),
      ...(input.handoff ? { handoff: input.handoff } : {}),
    },
    { unlessCancelled: true, notify: true, caseId: state.job.caseId }
  );

  if (!finished) {
    jobLog.log("job was cancelled — skipping succeeded write");
    return "cancelled";
  }

  if (input.proposalId !== null && input.interpretError === null) {
    const proposalId = input.proposalId;
    void (async () => {
      try {
        await notifyEvent({
          type: "proposal_created",
          caseId: state.job.caseId,
          proposalId,
        });
      } catch {
        /* empty */
      }
    })();
  }

  if (
    state.policy.markEvidenceProcessed === true &&
    input.interpretError === null
  ) {
    const shouldMark =
      input.markSourceProcessed === true ||
      (input.markSourceProcessed === undefined && Boolean(input.proposalId));
    const evidenceId = inputString(state.input, "evidenceId");
    if (shouldMark && evidenceId !== undefined && evidenceId !== "") {
      await markEvidenceProcessed({
        caseId: state.job.caseId,
        evidenceId,
      });
    }
  }

  return "succeeded";
}
