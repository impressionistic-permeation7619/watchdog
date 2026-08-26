import {
  checkPlaybookAvailability,
  formatPlanError,
  getCapability,
  getPlaybook,
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
} from "../graph/guards";
import { DomainError } from "../infra/domain-error";
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

/** Plan → insert run + step-0 Job → enqueue. */
export async function runPlaybook(
  input: RunPlaybookInput
): Promise<PlaybookRunResult> {
  await assertCaseExists(input.caseId);
  let playbook;
  try {
    playbook = getPlaybook(input.playbookId);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new DomainError("not_found", msg);
  }
  const { seed } = input;

  if (seed.entityId !== undefined && seed.entityId !== "") {
    await assertEntityInCase(input.caseId, seed.entityId);
  }
  if (seed.evidenceId !== undefined && seed.evidenceId !== "") {
    await assertEvidenceInCase(input.caseId, seed.evidenceId);
  }

  const plan = planPlaybook(playbook, seed);
  if ("kind" in plan) {
    throw new DomainError("invalid", formatPlanError(plan));
  }

  const descriptor = toPlaybookDescriptor(playbook);
  const thirdPartyCapabilityId = playbookCapabilityIds(playbook).find(
    (id) => (getCapability(id).egress ?? "none") === "third_party"
  );

  const credNames = new Set<string>();
  for (const spec of descriptor.requires.credentials) {
    if ("anyOf" in spec) for (const n of spec.anyOf) credNames.add(n);
    else credNames.add(spec.name);
  }
  const present = new Set<string>();
  // Independent credential lookups — safe to check concurrently.
  await Promise.all(
    [...credNames].map(async (name) => {
      if (await hasCredential(input.actorId, name)) present.add(name);
    })
  );

  const caseRow = await casesRepo.getById(db, input.caseId);
  const allowThirdPartyEgress = caseRow?.allowThirdPartyEgress ?? false;

  const availability = checkPlaybookAvailability(descriptor.requires, {
    hasCredential: (name) => present.has(name),
    allowThirdPartyEgress,
    thirdPartyCapabilityId,
  });
  if (!availability.ok) {
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
      .map(async (row) => enqueueCapJob(row.id, row.capabilityId))
  );

  return {
    playbookId: playbook.id,
    playbookRunId: result.run.id,
    jobs: result.jobRows.map((row) =>
      toJobRecord(row, playbook.id, result.run.status)
    ),
  };
}

export async function cancelPlaybookRun(
  caseId: string,
  playbookRunId: string
): Promise<{ playbookRunId: string; cancelledJobIds: string[] }> {
  await assertCaseExists(caseId);
  const now = new Date();
  return db.transaction(async (tx) => {
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
      cancellable.map(async (row) =>
        jobsRepo.cancelCancellable(tx, row.id, now)
      )
    );
    const cancelledJobIds = updatedIds.filter((id): id is string =>
      Boolean(id)
    );
    return { playbookRunId, cancelledJobIds };
  });
}
