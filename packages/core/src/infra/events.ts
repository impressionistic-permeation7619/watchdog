import { notifyEvent } from "@watchdog/db";

export {
  isWatchdogEvent,
  notifyEvent,
  listenForEvents,
  WATCHDOG_CHANNEL,
  type WatchdogEvent,
} from "@watchdog/db";

/**
 * Fan-out after a Case graph mutation. Call only after commit — SSE clients
 * refetch on receipt and would otherwise read pre-commit state.
 */
export function notifyEntityChanged(caseId: string): void {
  void notifyEvent({ type: "entity_changed", caseId });
}

/**
 * Fan-out after a Task mutation. Tasks are not Graph writes — separate event
 * so dossier/board consumers can invalidate without graph refetch.
 */
export function notifyTaskChanged(caseId: string, entityId?: string): void {
  void notifyEvent(
    entityId === undefined
      ? { type: "task_changed", caseId }
      : { type: "task_changed", caseId, entityId }
  );
}
