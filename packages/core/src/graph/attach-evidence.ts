import type { PatchOp } from "@watchdog/schemas";

/** Merge shared evidence ids onto claim / identifier / edge ops. */
export function attachEvidenceIds(
  patch: PatchOp[],
  evidenceIds: string[]
): PatchOp[] {
  if (evidenceIds.length === 0) return patch;
  return patch.map((op) => {
    if (
      op.resource === "claim" ||
      op.resource === "identifier" ||
      op.resource === "edge"
    ) {
      return {
        ...op,
        evidenceIds: [...new Set([...(op.evidenceIds ?? []), ...evidenceIds])],
      };
    }
    return op;
  });
}
