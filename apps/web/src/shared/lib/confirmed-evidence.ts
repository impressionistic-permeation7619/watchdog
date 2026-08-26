import type { ConfidenceTier } from "@watchdog/schemas";

export function isConfirmedBlocked(
  confidence: ConfidenceTier,
  evidenceIdsOrCount: readonly string[] | number
): boolean {
  const count =
    typeof evidenceIdsOrCount === "number"
      ? evidenceIdsOrCount
      : evidenceIdsOrCount.length;
  return confidence === "confirmed" && count === 0;
}

export const CONFIRMED_REQUIRES_EVIDENCE =
  "confirmed requires at least 1 evidence item";

export const CONFIRMED_REQUIRES_EVIDENCE_HINT =
  "confirmed requires evidence — link Evidence first";
