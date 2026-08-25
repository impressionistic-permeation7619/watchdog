import { setJobStatus } from "../set-job-status";

/** Active AbortControllers keyed by jobId — used by the worker to abort on cancel. */
export const activeControllers = new Map<string, AbortController>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function inputString(data: unknown, key: string): string | undefined {
  if (!isRecord(data)) return undefined;
  const v = data[key];
  return typeof v === "string" ? v : undefined;
}

export function linkedEvidenceId(
  data: unknown,
  fields: readonly ("evidenceId" | "sourceEvidenceId")[] | undefined
): string | undefined {
  if (fields === undefined || fields.length === 0) return undefined;
  for (const key of fields) {
    const v = inputString(data, key);
    if (v !== undefined && v !== "") return v;
  }
  return undefined;
}

export interface JobLog {
  lines: string[];
  log: (message: string) => void;
}

export function createJobLog(initial: string[] = []): JobLog {
  const lines = [...initial];
  return {
    lines,
    log: (message: string) => {
      lines.push(message);
    },
  };
}

export async function failJob(
  jobId: string,
  error: string,
  logs: string[] = []
): Promise<void> {
  await setJobStatus(
    jobId,
    {
      status: "failed",
      error,
      logs,
      finishedAt: new Date(),
    },
    { unlessCancelled: true, notify: true }
  );
}
