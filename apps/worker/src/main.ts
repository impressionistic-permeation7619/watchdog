import path from "node:path";
import { scheduler } from "node:timers/promises";

import {
  CAP_JOB_QUEUE,
  abortActiveJob,
  executeJob,
  findCancelledJobIds,
  ensureBossWorker,
  gracefulStopTimeoutMs,
  isCapJobPayload,
  isWatchdogEvent,
  listenForEvents,
  listActiveJobIds,
  reconcileStaleJobs,
  reconcileStuckPlaybookRuns,
} from "@watchdog/core";
import "@watchdog/env/server";
import {
  createLogger,
  initWatchdogLogger,
  jobWideEventFields,
} from "@watchdog/log";

import { handleExportEvent } from "./export-events";

function emitOnce(scope: string, fields: Record<string, unknown>): void {
  const log = createLogger({ scope });
  log.set(fields);
  void log.emit();
}

async function main() {
  const workerRoot = path.resolve(import.meta.dirname, "..");
  initWatchdogLogger({
    service: "watchdog-worker",
    drainDir: path.join(workerRoot, ".evlog", "logs"),
  });

  const boss = await ensureBossWorker();
  emitOnce("worker.boot", { message: `listening on ${CAP_JOB_QUEUE}` });

  const stale = await reconcileStaleJobs();
  if (stale > 0) {
    emitOnce("worker.reconcile", {
      message: `reconciled ${stale} stale running Job(s)`,
      stale,
    });
  }

  const stuckPlaybooks = await reconcileStuckPlaybookRuns();
  if (stuckPlaybooks > 0) {
    emitOnce("worker.reconcile", {
      message: `reconciled ${stuckPlaybooks} stuck playbook run(s)`,
      stuckPlaybooks,
    });
  }

  await boss.work(
    CAP_JOB_QUEUE,
    { localConcurrency: 1, pollingIntervalSeconds: 2 },
    async ([job]) => {
      const log = createLogger({
        scope: "cap.job",
        bossJobId: job.id,
      });
      try {
        if (!isCapJobPayload(job.data)) {
          // Do not log raw boss `data` — invalid payloads are untrusted JSON.
          log.set({
            job: { outcome: "invalid_payload" },
            error: { message: "missing jobId in payload" },
            payloadType: job.data === null ? "null" : typeof job.data,
          });
          return;
        }
        const data = job.data;
        try {
          const outcome = await executeJob(data.jobId);
          log.set(
            jobWideEventFields({
              jobId: data.jobId,
              outcome: outcome.outcome,
              stopReason: outcome.stopReason,
              abortReason: outcome.abortReason,
              fromCache: outcome.fromCache,
              reclaim: outcome.reclaim,
              durationMs: outcome.durationMs,
              caseId: outcome.caseId,
              capabilityId: outcome.capabilityId,
              playbookRunId: outcome.playbookRunId,
            })
          );
        } catch (error: unknown) {
          // Never rethrow — product failJob already ran (or preflight stopped).
          // Accidental throws would still get at most one pg-boss retry.
          log.set(
            jobWideEventFields({
              jobId: data.jobId,
              outcome: "handler_error",
            })
          );
          log.error(error instanceof Error ? error : new Error(String(error)));
        }
      } finally {
        void log.emit();
      }
    }
  );

  const listener = listenForEvents(
    (rawPayload) => {
      try {
        const parsed: unknown = JSON.parse(rawPayload);
        if (isWatchdogEvent(parsed)) {
          handleExportEvent(parsed);
        }
      } catch (error: unknown) {
        const log = createLogger({ scope: "export-sync.listen" });
        log.set({ message: "malformed watchdog_events payload" });
        log.error(error instanceof Error ? error : new Error(String(error)));
        void log.emit();
      }
    },
    () => {
      emitOnce("export-sync", { message: "listening for graph events" });
    },
    (error: unknown) => {
      const log = createLogger({ scope: "export-sync.listen" });
      log.set({ message: "LISTEN connection failed" });
      log.error(error instanceof Error ? error : new Error(String(error)));
      void log.emit();
    }
  );

  const cancelPollInterval = setInterval(() => {
    void (async () => {
      const running = listActiveJobIds();
      if (running.length === 0) return;
      try {
        const cancelled = await findCancelledJobIds([...running]);
        for (const id of cancelled) {
          abortActiveJob(id, "cancel");
        }
      } catch (error: unknown) {
        const log = createLogger({ scope: "worker.cancel_poll" });
        log.error(error instanceof Error ? error : new Error(String(error)));
        void log.emit();
      }
    })();
  }, 2000);

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    const fields: Record<string, unknown> = {
      message: `shutting down (${signal})`,
    };
    clearInterval(cancelPollInterval);
    try {
      await listener.end();
    } catch (error: unknown) {
      fields.listenerEndError =
        error instanceof Error ? error.message : String(error);
    }
    try {
      await boss.stop({
        graceful: true,
        timeout: gracefulStopTimeoutMs(),
      });
    } catch (error: unknown) {
      fields.bossStopError =
        error instanceof Error ? error.message : String(error);
    }
    emitOnce("worker.shutdown", fields);
    process.exit(0);
  };

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });
}

try {
  await main();
} catch (error: unknown) {
  const log = createLogger({ scope: "worker.fatal" });
  log.error(error instanceof Error ? error : new Error(String(error)));
  // Emit is sync for the wide-event seal; give the FS drain a tick before exit.
  log.emit();
  await scheduler.yield();
  process.exit(1);
}
