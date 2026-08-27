export type ActiveJobAbortReason = "timeout" | "cancel";

const activeControllers = new Map<string, AbortController>();

/** Register the live AbortController for a running Cap Job (worker cancel poll). */
export function registerActiveJobController(
  jobId: string,
  controller: AbortController
): void {
  activeControllers.set(jobId, controller);
}

export function unregisterActiveJobController(jobId: string): void {
  activeControllers.delete(jobId);
}

export function getActiveJobAbortSignal(
  jobId: string
): AbortSignal | undefined {
  return activeControllers.get(jobId)?.signal;
}

/** Abort a running job; returns false when no controller is registered. */
export function abortActiveJob(
  jobId: string,
  reason: ActiveJobAbortReason
): boolean {
  const controller = activeControllers.get(jobId);
  if (controller === undefined) return false;
  controller.abort(reason);
  return true;
}

export function listActiveJobIds(): readonly string[] {
  return [...activeControllers.keys()];
}
