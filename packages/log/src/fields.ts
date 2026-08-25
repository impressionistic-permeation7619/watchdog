/**
 * Field stubs for Watchdog process logs.
 * Keep payloads small; never put Evidence body / secrets here.
 */

export interface JobLogFields {
  jobId?: string;
  outcome?: string;
  stopReason?: string;
  abortReason?: string;
  fromCache?: boolean;
  reclaim?: boolean;
  durationMs?: number;
}

export interface CaseLogFields {
  caseId?: string;
}

export interface CapLogFields {
  capabilityId?: string;
  playbookRunId?: string;
}

export interface UserLogFields {
  userId?: string;
  email?: string;
}

export interface AuthLogFields {
  method?: "session" | "apiKey" | "none";
  denied?: boolean;
  reason?: string;
}

export function jobWideEventFields(input: {
  jobId: string;
  outcome: string;
  stopReason?: string;
  abortReason?: string;
  fromCache?: boolean;
  reclaim?: boolean;
  durationMs?: number;
  caseId?: string;
  capabilityId?: string;
  playbookRunId?: string | null;
}): {
  job: JobLogFields;
  case?: CaseLogFields;
  cap: CapLogFields;
} {
  return {
    job: {
      jobId: input.jobId,
      outcome: input.outcome,
      stopReason: input.stopReason,
      abortReason: input.abortReason,
      fromCache: input.fromCache,
      reclaim: input.reclaim,
      durationMs: input.durationMs,
    },
    case: input.caseId ? { caseId: input.caseId } : undefined,
    cap: {
      capabilityId: input.capabilityId,
      playbookRunId: input.playbookRunId ?? undefined,
    },
  };
}
