import {
  casesRepo,
  db,
  entitiesRepo,
  evidenceRepo,
  type DbExec,
} from "@watchdog/db";
import type { ConfidenceTier } from "@watchdog/schemas";

import { DomainError } from "../infra/domain-error";

export async function assertCaseExists(
  caseId: string,
  exec: DbExec = db
): Promise<void> {
  const row = await casesRepo.getById(exec, caseId);
  if (!row) throw new DomainError("not_found", "Case not found");
}

export async function assertEntityInCase(
  caseId: string,
  entityId: string,
  exec: DbExec = db
): Promise<void> {
  const row = await entitiesRepo.getInCase(exec, caseId, entityId);
  if (!row) {
    throw new DomainError("not_found", "Entity not found in this Case");
  }
}

export async function assertEvidenceInCase(
  caseId: string,
  evidenceId: string,
  exec: DbExec = db
): Promise<void> {
  const row = await evidenceRepo.getActiveInCase(exec, caseId, evidenceId);
  if (!row) {
    throw new DomainError("not_found", "Evidence not found in this Case");
  }
}

/** Confirmed claims/ids/edges require at least one Evidence attachment. */
export function assertConfidenceEvidence(
  confidence: ConfidenceTier,
  evidenceIds: string[]
): void {
  if (confidence === "confirmed" && evidenceIds.length === 0) {
    throw new DomainError(
      "invalid",
      "confirmed requires at least one Evidence attachment"
    );
  }
}
