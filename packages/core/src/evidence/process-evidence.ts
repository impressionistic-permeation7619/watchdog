import {
  db,
  evidenceRepo,
  jobsRepo,
  type EvidenceCapSeed,
  type JobRow,
} from "@watchdog/db";
import type { JsonObject } from "@watchdog/schemas";
import {
  EVIDENCE_EXTRACT_AI_CAPABILITY_ID,
  EVIDENCE_HARVEST_CAPABILITY_ID,
  URL_ENRICH_CAPABILITY_ID,
} from "@watchdog/schemas";

import { DomainError } from "../infra/domain-error";
import { startJob, type JobRecord, toJobRecord } from "../jobs/start-job";

/**
 * Shared Intake glue: load Evidence, dedupe against active Cap Jobs, startJob.
 */
async function startCapForEvidence(input: {
  caseId: string;
  evidenceId: string;
  actorId: string;
  capabilityId: string;
  matchActive: (job: JobRow, seed: EvidenceCapSeed) => boolean;
  buildInput: (seed: EvidenceCapSeed) => JsonObject;
  /** Optional gate after Evidence load (e.g. require http(s) URL). */
  assertSeed?: (seed: EvidenceCapSeed) => void;
}): Promise<JobRecord> {
  const seed = await evidenceRepo.getCapSeedInCase(
    db,
    input.caseId,
    input.evidenceId
  );
  if (!seed) throw new DomainError("not_found", "Evidence not found");
  input.assertSeed?.(seed);

  const active = await jobsRepo.listActiveForCapability(
    db,
    input.caseId,
    input.capabilityId
  );
  for (const job of active) {
    if (input.matchActive(job, seed)) {
      return toJobRecord(job);
    }
  }

  return await startJob({
    caseId: input.caseId,
    capabilityId: input.capabilityId,
    actorId: input.actorId,
    input: input.buildInput(seed),
  });
}

export async function processEvidence(input: {
  caseId: string;
  evidenceId: string;
  actorId: string;
  /** When true, start evidence.extract.ai instead of evidence.harvest. */
  ai?: boolean;
}): Promise<JobRecord> {
  const capabilityId =
    input.ai === true
      ? EVIDENCE_EXTRACT_AI_CAPABILITY_ID
      : EVIDENCE_HARVEST_CAPABILITY_ID;

  return await startCapForEvidence({
    caseId: input.caseId,
    evidenceId: input.evidenceId,
    actorId: input.actorId,
    capabilityId,
    matchActive: (job, seed) => {
      const eid =
        typeof job.input === "object" && job.input !== null
          ? (job.input as { evidenceId?: string }).evidenceId
          : undefined;
      return eid === seed.id;
    },
    buildInput: (seed) => ({
      evidenceId: seed.id,
      ...(typeof seed.entityId === "string" && seed.entityId !== ""
        ? { entityId: seed.entityId }
        : {}),
    }),
  });
}

export async function markEvidenceProcessed(input: {
  caseId: string;
  evidenceId: string;
}): Promise<void> {
  await evidenceRepo.markProcessed(db, input.caseId, input.evidenceId);
}

export async function enrichUrlEvidence(input: {
  caseId: string;
  evidenceId: string;
  actorId: string;
}): Promise<JobRecord> {
  return await startCapForEvidence({
    caseId: input.caseId,
    evidenceId: input.evidenceId,
    actorId: input.actorId,
    capabilityId: URL_ENRICH_CAPABILITY_ID,
    assertSeed: (seed) => {
      const url = (seed.sourceUrl ?? seed.text)?.trim();
      if (url === undefined || url === "" || !/^https?:\/\//i.test(url)) {
        throw new DomainError(
          "invalid",
          "Evidence has no http(s) URL to enrich"
        );
      }
    },
    matchActive: (job, seed) => {
      const url = (seed.sourceUrl ?? seed.text)?.trim() ?? "";
      const inputUrl =
        typeof job.input === "object" && job.input !== null
          ? (job.input as { url?: string; sourceEvidenceId?: string }).url
          : undefined;
      const sourceId =
        typeof job.input === "object" && job.input !== null
          ? (job.input as { sourceEvidenceId?: string }).sourceEvidenceId
          : undefined;
      return sourceId === seed.id || inputUrl === url;
    },
    buildInput: (seed) => {
      const url = (seed.sourceUrl ?? seed.text)?.trim() ?? "";
      return {
        url,
        sourceEvidenceId: seed.id,
        ...(typeof seed.entityId === "string" && seed.entityId !== ""
          ? { entityId: seed.entityId }
          : {}),
      };
    },
  });
}
