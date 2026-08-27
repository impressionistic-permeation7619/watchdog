import {
  checkPlaybookAvailability,
  formatPlanError,
  requireCapability,
  requirePlaybook,
  planPlaybook,
  playbookCapabilityIds,
  seedValuesToJson,
  toPlaybookDescriptor,
  type SeedValues,
} from "@watchdog/caps";
import { casesRepo, db, jobsRepo, playbookRunsRepo } from "@watchdog/db";

import {
  assertCaseExists,
  assertEntityInCase,
  assertEvidenceInCase,
} from "../graph/patch/guards";
import { DomainError, errorMessage } from "../infra/domain-error";
import { logProcess } from "../infra/process-log";
import { hasCredential } from "../infra/vault";
import { enqueueCapJob } from "./boss";
import { toJobRecord, type JobRecord } from "./start-job";

export interface RunPlaybookInput {
  caseId: string;
  playbookId: string;
  actorId: string;
  seed: SeedValues;
}

export interface PlaybookRunResult {
  playbookId: string;
  playbookRunId: string;
  jobs: JobRecord[];
}

function loadPlaybook(playbookId: string) {
  try {
    return requirePlaybook(playbookId);
  } catch (error) {
    throw new DomainError("not_found", errorMessage(error));
  }
}

async function assertSeedAnchorsInCase(
  caseId: string,
  seed: SeedValues
): Promise<void> {
  if (seed.entityId !== undefined && seed.entityId !== "") {
    await assertEntityInCase(caseId, seed.entityId);
  }
  if (seed.evidenceId !== undefined && seed.evidenceId !== "") {
    await assertEvidenceInCase(caseId, seed.evidenceId);
  }
}

function credentialNamesFromDescriptor(
  descriptor: ReturnType<typeof toPlaybookDescriptor>
): Set<string> {
  const credNames = new Set<string>();
  for (const spec of descriptor.requires.credentials) {
    if ("anyOf" in spec) for (const n of spec.anyOf) credNames.add(n);
    else credNames.add(spec.name);
  }
  return credNames;
}

async function presentCredentialNames(
  actorId: string,
  credNames: Iterable<string>
): Promise<Set<string>> {
  const present = new Set<string>();
  // Independent credential lookups — safe to check concurrently.
  await Promise.all(
    [...credNames].map(async (name) => {
      if (await hasCredential(actorId, name)) present.add(name);
    })
  );
  return present;
}

function thirdPartyCapabilityId(playbook: ReturnType<typeof requirePlaybook>) {
  return playbookCapabilityIds(playbook).find(
    (id) => (requireCapability(id).egress ?? "none") === "third_party"
  );
}

function ensurePlaybookRunnable(
  descriptor: ReturnType<typeof toPlaybookDescriptor>,
  present: Set<string>,
  allowThirdPartyEgress: boolean,
  playbook: ReturnType<typeof requirePlaybook>
): void {
  const availability = checkPlaybookAvailability(descriptor.requires, {
    hasCredential: (name) => present.has(name),
    allowThirdPartyEgress,
    thirdPartyCapabilityId: thirdPartyCapabilityId(playbook),
  });
  if (availability.ok) return;
  if (availability.kind === "egress_blocked") {
    throw new DomainError(
      "forbidden",
      `Case does not permit third-party egress — enable it in Case settings before running ${availability.capabilityId}`
    );
  }
  throw new DomainError(
    "forbidden",
    `Missing credential — set one of ${availability.names.join(" | ")} in Settings before running this playbook`
  );
}

/** Plan → insert run + step-0 Job → enqueue. */
export async function runPlaybook(
  input: RunPlaybookInput
): Promise<PlaybookRunResult> {
  await assertCaseExists(input.caseId);
  const playbook = loadPlaybook(input.playbookId);
  const { seed } = input;

  await assertSeedAnchorsInCase(input.caseId, seed);

  const plan = planPlaybook(playbook, seed);
  if ("kind" in plan) {
    throw new DomainError("invalid", formatPlanError(plan));
  }

  const descriptor = toPlaybookDescriptor(playbook);
  const present = await presentCredentialNames(
    input.actorId,
    credentialNamesFromDescriptor(descriptor)
  );

  const caseRow = await casesRepo.getById(db, input.caseId);
  ensurePlaybookRunnable(
    descriptor,
    present,
    caseRow?.allowThirdPartyEgress ?? false,
    playbook
  );

  const seedJson = seedValuesToJson(seed);

  const result = await db.transaction(async (tx) => {
    const run = await playbookRunsRepo.create(tx, {
      caseId: input.caseId,
      playbookId: playbook.id,
      seed: seedJson,
      status: "running",
      actorId: input.actorId,
    });
    if (!run) {
      throw new DomainError("invalid", "Failed to create playbook run");
    }

    const row = await jobsRepo.create(tx, {
      caseId: input.caseId,
      capabilityId: plan.step.capabilityId,
      input: plan.step.input,
      status: "queued",
      actorId: input.actorId,
      logs: [],
      playbookRunId: run.id,
      playbookStep: plan.step.playbookStep,
      playbookFanIndex: 0,
    });
    if (!row) {
      throw new DomainError(
        "invalid",
        `Failed to create Job for step ${plan.step.playbookStep}`
      );
    }

    return { run, jobRows: [row] };
  });

  // Independent per-Job enqueues — safe to run concurrently.
  await Promise.all(
    result.jobRows
      .filter((row) => row.status === "queued")
      .map(async (row) => await enqueueCapJob(row.id, row.capabilityId))
  );

  return {
    playbookId: playbook.id,
    playbookRunId: result.run.id,
    jobs: result.jobRows.map((row) =>
      toJobRecord(row, playbook.id, result.run.status)
    ),
  };
}

type CancelPlaybookRunOpts = { actorId?: string };

type CancelPlaybookRunResult = {
  playbookRunId: string;
  cancelledJobIds: string[];
};

export async function cancelPlaybookRun(
  caseId: string,
  playbookRunId: string,
  opts?: CancelPlaybookRunOpts
): Promise<CancelPlaybookRunResult> {
  await assertCaseExists(caseId);
  const now = new Date();
  const result = await db.transaction(async (tx) => {
    const run = await playbookRunsRepo.lock(tx, playbookRunId);
    if (!run || run.caseId !== caseId) {
      throw new DomainError("not_found", "Playbook run not found");
    }
    if (run.status !== "running") {
      throw new DomainError(
        "conflict",
        "Only running playbook runs can be cancelled"
      );
    }

    await playbookRunsRepo.setStatus(tx, playbookRunId, "cancelled", now);

    const cancellable = await jobsRepo.listCancellableForPlaybookRun(
      tx,
      caseId,
      playbookRunId
    );
    const updatedIds = await Promise.all(
      cancellable.map(
        async (row) => await jobsRepo.cancelCancellable(tx, row.id, now)
      )
    );
    const cancelledJobIds = updatedIds.filter((id): id is string =>
      Boolean(id)
    );
    return { playbookRunId, cancelledJobIds };
  });
  if (opts?.actorId) {
    logProcess("playbook.cancel", "Playbook run cancelled", {
      caseId,
      playbookRunId,
      actorId: opts.actorId,
      cancelledJobCount: result.cancelledJobIds.length,
    });
  }
  return result;
}
