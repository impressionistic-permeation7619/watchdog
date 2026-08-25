import { db, proposalsRepo } from "@watchdog/db";
import type { PatchOp } from "@watchdog/schemas";

import { attachEvidenceIds } from "../../graph/attach-evidence";

export interface ProposeResult {
  proposalId: string | null;
  resultSummary: string | null;
  suppressedCount: number;
}

export interface ProposeStageInput {
  caseId: string;
  kept: PatchOp[];
  suppressed: number;
  /** Cap-owned prose only — all-known lives in `suppressedCount`, not the string. */
  resultSummary: string | null;
  attachEvidenceIds: string[];
  /** Cap Jobs set this; agent propose leaves null. */
  jobId?: string | null;
  agentSourced?: boolean;
  createdBy?: string | null;
}

/** Insert a pending Proposal with evidence attached to claim/identifier/edge ops. */
export async function proposeStage(
  input: ProposeStageInput
): Promise<ProposeResult> {
  if (input.kept.length === 0) {
    return {
      proposalId: null,
      resultSummary: input.resultSummary,
      suppressedCount: input.suppressed,
    };
  }

  const withEvidence = attachEvidenceIds(input.kept, input.attachEvidenceIds);

  const prop = await proposalsRepo.create(db, {
    caseId: input.caseId,
    jobId: input.jobId ?? null,
    status: "pending",
    patch: withEvidence,
    summary: input.resultSummary,
    suppressedCount: input.suppressed,
    evidenceIds: input.attachEvidenceIds,
    agentSourced: input.agentSourced ?? false,
    userOverridden: false,
    createdBy: input.createdBy ?? null,
  });

  return {
    proposalId: prop?.id ?? null,
    resultSummary: input.resultSummary,
    suppressedCount: input.suppressed,
  };
}
