/**
 * SSE / LISTEN-NOTIFY payload shapes. Shared by server emitters and the
 * browser live-events hook — keep this module free of Node / DB imports.
 */
export type WatchdogEvent =
  | { type: "job_update"; caseId: string; jobId: string; status: string }
  | { type: "proposal_created"; caseId: string; proposalId: string }
  | { type: "entity_changed"; caseId: string }
  | { type: "task_changed"; caseId: string; entityId?: string };

/** Runtime guard for payloads read off the `watchdog_events` channel / SSE. */
export function isWatchdogEvent(value: unknown): value is WatchdogEvent {
  if (typeof value !== "object" || value === null || !("type" in value)) {
    return false;
  }
  if (value.type === "job_update") {
    return "caseId" in value && "jobId" in value && "status" in value;
  }
  if (value.type === "proposal_created") {
    return "caseId" in value && "proposalId" in value;
  }
  if (value.type === "entity_changed") {
    return "caseId" in value;
  }
  if (value.type === "task_changed") {
    return "caseId" in value;
  }
  return false;
}
