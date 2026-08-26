import type { z } from "zod";

import type {
  CapabilityDef,
  CapJobPolicy,
  JsonObject,
} from "@watchdog/cap-sdk";
import { getCapability } from "@watchdog/caps";
import { db, jobsRepo, type JobArtifact, type JobRow } from "@watchdog/db";
import { isJsonObject } from "@watchdog/schemas";

import { logProcess } from "../../infra/process-log";
import { errorMessage } from "../../infra/domain-error";
import {
  evaluateCapAvailability,
  formatCapAvailabilityError,
} from "../cap-availability";
import { setJobStatus } from "../set-job-status";
import { failJob } from "./helpers";

export interface PreflightState {
  jobId: string;
  job: JobRow;
  cap: CapabilityDef<z.ZodType>;
  policy: CapJobPolicy;
  input: JsonObject;
  allowThirdPartyEgress: boolean;
  reclaimArtifacts: JobArtifact[] | null;
  reclaimEvidenceIds: string[];
}

export type PreflightStopReason =
  | "not_found"
  | "cancelled"
  | "already_terminal"
  | "reclaim_converged"
  | "unknown_capability"
  | "invalid_input"
  | "egress_denied"
  | "missing_credential";

export type PreflightResult =
  | { kind: "stop"; reason: PreflightStopReason }
  | { kind: "ready"; state: PreflightState };

/**
 * Load Job, validate Cap input, enforce egress + credentials, mark running.
 * Returns `stop` when the Job should not proceed (terminal / failed preflight).
 * Missing Job and unknown Capability resolve as `stop` (no throw) so pg-boss
 * does not retry those cases. DB / failJob errors may still propagate — the
 * worker handler catches them.
 */
export async function preflight(jobId: string): Promise<PreflightResult> {
  const job = await jobsRepo.get(db, jobId);
  if (!job) {
    logProcess("preflight", `Job not found: ${jobId}`, { jobId });
    return { kind: "stop", reason: "not_found" };
  }
  if (job.status === "cancelled") {
    return { kind: "stop", reason: "cancelled" };
  }
  if (job.status !== "queued" && job.status !== "running") {
    return { kind: "stop", reason: "already_terminal" };
  }

  // Reclaim convergence: Job already finished Proposal path
  if (job.proposalId !== null && job.status === "running") {
    await setJobStatus(jobId, {
      status: "succeeded",
      finishedAt: job.finishedAt ?? new Date(),
    });
    return { kind: "stop", reason: "reclaim_converged" };
  }

  let cap: CapabilityDef<z.ZodType>;
  try {
    cap = getCapability(job.capabilityId);
  } catch (error) {
    const msg = errorMessage(error);
    await failJob(jobId, msg);
    return { kind: "stop", reason: "unknown_capability" };
  }
  const policy = cap.jobPolicy ?? {};
  const parsed = cap.input.safeParse(job.input);
  if (!parsed.success) {
    await failJob(jobId, `Invalid input: ${parsed.error.message}`);
    return { kind: "stop", reason: "invalid_input" };
  }
  if (!isJsonObject(parsed.data)) {
    await failJob(jobId, "Invalid input: parsed input was not a JSON object");
    return { kind: "stop", reason: "invalid_input" };
  }

  const { allowThirdPartyEgress, result } = await evaluateCapAvailability({
    actorId: job.actorId,
    caseId: job.caseId,
    cap,
  });
  if (!result.ok) {
    await failJob(jobId, formatCapAvailabilityError(result, cap.id));
    return {
      kind: "stop",
      reason:
        result.kind === "egress_blocked"
          ? "egress_denied"
          : "missing_credential",
    };
  }

  const reclaimArtifacts =
    Array.isArray(job.output) && job.output.length > 0 ? job.output : null;
  const reclaimEvidenceIds = job.evidenceIds ?? [];

  await setJobStatus(jobId, {
    status: "running",
    startedAt: job.startedAt ?? new Date(),
    ...(reclaimArtifacts ? {} : { logs: [] as string[] }),
  });

  return {
    kind: "ready",
    state: {
      jobId,
      job,
      cap,
      policy,
      input: parsed.data,
      allowThirdPartyEgress,
      reclaimArtifacts,
      reclaimEvidenceIds,
    },
  };
}
