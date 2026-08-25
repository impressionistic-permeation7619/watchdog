import type { PatchOp } from "@watchdog/schemas";

/** Resources where Inbox Accept must choose confidence. */
export function patchNeedsConfidence(patch: PatchOp[]): boolean {
  return patch.some(
    (op) =>
      op.resource === "claim" ||
      op.resource === "identifier" ||
      op.resource === "edge"
  );
}
