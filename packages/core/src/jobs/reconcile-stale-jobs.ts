import { db, jobsRepo, playbookRunsRepo } from "@watchdog/db";
import { isOpenJobStatus } from "@watchdog/schemas";

import { logSwallowed } from "../infra/process-log";
import { advancePlaybookRun } from "./stages/chain";
import { failJob } from "./stages/helpers";
import { capExpireSeconds } from "./timeouts";

const STALE_ERROR = "worker restarted while this Job was running";

type StaleJobRow = Awaited<ReturnType<typeof jobsRepo.listRunning>>[number];

/** Fails one stale Job + abandons its playbook run. Returns whether it failed it. */
async function reconcileStaleJob(
  row: StaleJobRow,
  now: number
): Promise<boolean> {
  let expireSeconds: number;
  try {
    expireSeconds = capExpireSeconds(row.capabilityId);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await failJob(row.id, `Unknown Capability ${row.capabilityId}: ${msg}`);
    if (row.playbookRunId !== null) {
      await advancePlaybookRun({
        playbookRunId: row.playbookRunId,
      }).catch((abandonError: unknown) => {
        logSwallowed("reconcile.abandon", abandonError, { jobId: row.id });
      });
    }
    return true;
  }

  const ageMs = now - row.updatedAt.getTime();
  if (ageMs < expireSeconds * 1000) return false;

  await failJob(row.id, STALE_ERROR);
  if (row.playbookRunId !== null) {
    await advancePlaybookRun({
      playbookRunId: row.playbookRunId,
    }).catch((abandonError: unknown) => {
      logSwallowed("reconcile.abandon", abandonError, { jobId: row.id });
    });
  }
  return true;
}

/**
 * Fail product Jobs left `running` after a hard worker crash.
 * Age threshold is per-Cap (derived expire window) so a hung dns.lookup is
 * reclaimed long before a hung url.enrich.
 */
export async function reconcileStaleJobs(): Promise<number> {
  const running = await jobsRepo.listRunning(db);
  const now = Date.now();

  // Independent per-Job reconciliation — safe to run concurrently.
  const results = await Promise.all(
    running.map(async (row) => reconcileStaleJob(row, now))
  );
  return results.filter(Boolean).length;
}

/** Re-advance playbook runs left `running` after a swallowed advance error. */
export async function reconcileStuckPlaybookRuns(): Promise<number> {
  const running = await playbookRunsRepo.listRunning(db);

  const results = await Promise.all(
    running.map(async (run) => {
      const members = await jobsRepo.listStatusesForPlaybookRun(db, run.id);
      if (members.some((m) => isOpenJobStatus(m.status))) return false;

      try {
        await advancePlaybookRun({
          playbookRunId: run.id,
          caseId: run.caseId,
        });
        return true;
      } catch (error: unknown) {
        logSwallowed("reconcile.playbook_advance", error, {
          playbookRunId: run.id,
        });
        return false;
      }
    })
  );
  return results.filter(Boolean).length;
}
