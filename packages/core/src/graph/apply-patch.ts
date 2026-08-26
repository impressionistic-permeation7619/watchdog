import { db, type DbTx } from "@watchdog/db";
import { assertPatchGates } from "@watchdog/policy";
import type { ConfidenceTier, PatchOp } from "@watchdog/schemas";

import { DomainError, errorMessage } from "../infra/domain-error";
import { applyClaimOp } from "./apply-claim-op";
import { applyEdgeOp } from "./apply-edge-op";
import { applyEntityOp } from "./apply-entity-op";
import { applyEventOp } from "./apply-event-op";
import { applyIdentifierOp } from "./apply-identifier-op";
import { applyQuestionOp } from "./apply-question-op";

export type ApplyPatchTx = DbTx;

export interface ApplyPatchOpts {
  caseId: string;
  patch: PatchOp[];
  confidence?: ConfidenceTier;
  sharedEvidenceIds?: string[];
  /** When set, run inside this transaction (no nested begin). */
  tx?: DbTx;
}

async function applyOp(
  tx: DbTx,
  caseId: string,
  op: PatchOp,
  confidence: ConfidenceTier | undefined,
  sharedEvidenceIds: string[]
): Promise<void> {
  const evidenceIds = [
    ...new Set([...(op.evidenceIds ?? []), ...sharedEvidenceIds]),
  ];

  switch (op.resource) {
    case "claim": {
      await applyClaimOp(tx, caseId, op, confidence, evidenceIds);
      return;
    }
    case "event": {
      await applyEventOp(tx, caseId, op);
      return;
    }
    case "question": {
      await applyQuestionOp(tx, caseId, op);
      return;
    }
    case "entity": {
      await applyEntityOp(tx, caseId, op);
      return;
    }
    case "identifier": {
      await applyIdentifierOp(tx, caseId, op, confidence, evidenceIds);
      return;
    }
    case "edge": {
      await applyEdgeOp(tx, caseId, op, confidence, evidenceIds);
      return;
    }
    default: {
      const _exhaustive: never = op.resource;
      throw new DomainError(
        "invalid",
        `Unhandled resource: ${JSON.stringify(_exhaustive)}`
      );
    }
  }
}

export async function applyPatch(opts: ApplyPatchOpts): Promise<void> {
  try {
    assertPatchGates(opts.patch, {
      confidence: opts.confidence,
      sharedEvidenceIds: opts.sharedEvidenceIds,
    });
  } catch (error) {
    if (error instanceof DomainError) throw error;
    throw new DomainError(
      "invalid",
      errorMessage(error, "Patch gate rejected")
    );
  }

  const run = async (tx: DbTx) => {
    for (const op of opts.patch) {
      // oxlint-disable-next-line no-await-in-loop -- same-tx ops apply in order; later ops may reference entities created by earlier ones
      await applyOp(
        tx,
        opts.caseId,
        op,
        opts.confidence,
        opts.sharedEvidenceIds ?? []
      );
    }
  };

  if (opts.tx) {
    await run(opts.tx);
    return;
  }
  await db.transaction(run);
}
