import type { z } from "zod";

import type {
  CapabilityDef,
  CapJobPolicy,
  JsonObject,
} from "@watchdog/cap-sdk";
import { requireCapability } from "@watchdog/caps";
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

function preflightEarlyStop(job: JobRow): PreflightStopReason | null {
  if (job.status === "cancelled") return "cancelled";
  if (job.status !== "queued" && job.status !== "running") {
    return "already_terminal";
  }
  return null;
}

async function convergeReclaimStop(jobId: string, job: JobRow): Promise<void> {
  await setJobStatus(jobId, {
    status: "succeeded",
    finishedAt: job.finishedAt ?? new Date(),
  });
}

async function loadCapOrStop(
  jobId: string,
  capabilityId: string
): Promise<CapabilityDef<z.ZodType> | PreflightStopReason> {
  try {
    return requireCapability(capabilityId);
  } catch (error) {
    await failJob(jobId, errorMessage(error));
    return "unknown_capability";
  }
}

async function parseCapInputOrStop(
  jobId: string,
  cap: CapabilityDef<z.ZodType>,
  rawInput: unknown
): Promise<JsonObject | PreflightStopReason> {
  const parsed = cap.input.safeParse(rawInput);
  if (!parsed.success) {
    await failJob(jobId, `Invalid input: ${parsed.error.message}`);
    return "invalid_input";
  }
  if (!isJsonObject(parsed.data)) {
    await failJob(jobId, "Invalid input: parsed input was not a JSON object");
    return "invalid_input";
  }
  return parsed.data;
}

async function enforceCapAvailabilityOrStop(
  jobId: string,
  job: JobRow,
  cap: CapabilityDef<z.ZodType>
): Promise<
  | { kind: "stop"; reason: PreflightStopReason }
  | { kind: "ready"; allowThirdPartyEgress: boolean }
> {
  const { allowThirdPartyEgress, result } = await evaluateCapAvailability({
    actorId: job.actorId,
    caseId: job.caseId,
    cap,
  });
  if (result.ok) {
    return { kind: "ready", allowThirdPartyEgress };
  }
  await failJob(jobId, formatCapAvailabilityError(result, cap.id));
  return {
    kind: "stop",
    reason:
      result.kind === "egress_blocked"
        ? "egress_denied"
        : "missing_credential",
  };
}

async function preparePreflightReady(
  jobId: string,
  job: JobRow
): Promise<PreflightResult> {
  const capOrStop = await loadCapOrStop(jobId, job.capabilityId);
  if (typeof capOrStop === "string") {
    return { kind: "stop", reason: capOrStop };
  }
  const cap = capOrStop;
  const policy = cap.jobPolicy ?? {};

  const inputOrStop = await parseCapInputOrStop(jobId, cap, job.input);
  if (typeof inputOrStop === "string") {
    return { kind: "stop", reason: inputOrStop };
  }
  const input = inputOrStop;

  const availability = await enforceCapAvailabilityOrStop(jobId, job, cap);
  if (availability.kind === "stop") return availability;

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
      input,
      allowThirdPartyEgress: availability.allowThirdPartyEgress,
      reclaimArtifacts,
      reclaimEvidenceIds,
    },
  };
}

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

  const earlyStop = preflightEarlyStop(job);
  if (earlyStop !== null) {
    return { kind: "stop", reason: earlyStop };
  }

  // Reclaim convergence: Job already finished Proposal path
  if (job.proposalId !== null && job.status === "running") {
    await convergeReclaimStop(jobId, job);
    return { kind: "stop", reason: "reclaim_converged" };
  }

  return preparePreflightReady(jobId, job);
}
