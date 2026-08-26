/** Slim worker surface — avoids loading the full @watchdog/core graph barrel. */
export {
  CAP_JOB_QUEUE,
  ensureBossWorker,
  isCapJobPayload,
  type CapJobPayload,
  type BossRole,
} from "./jobs/boss";
export { gracefulStopTimeoutMs } from "./jobs/timeouts";
export {
  reconcileStaleJobs,
  reconcileStuckPlaybookRuns,
} from "./jobs/reconcile-stale-jobs";
export {
  executeJob,
  abortActiveJob,
  listActiveJobIds,
  type JobRunOutcome,
  type JobAbortReason,
  type JobRunOutcomeName,
} from "./jobs/run-job";
export { findCancelledJobIds } from "./jobs/start-job";
export { isWatchdogEvent, listenForEvents } from "./infra/events";
