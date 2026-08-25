import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretObservationClaim } from "../../lib/collect/interpret-observation-claim";
import type { dshieldLookupInput } from "./input";
import type { DshieldLookupSnapshot } from "./report-schema";

type DshieldInput = z.infer<typeof dshieldLookupInput>;

function summarize(report: DshieldLookupSnapshot): string {
  if (!report.found) {
    return `SANS ISC DShield for ${report.ip}: no honeypot sightings on record`;
  }
  const parts: string[] = [];
  if (report.attacks !== null) parts.push(`attacks=${report.attacks}`);
  if (report.count !== null) parts.push(`reports=${report.count}`);
  if (report.maxrisk !== null) parts.push(`maxrisk=${report.maxrisk}`);
  if (report.asn !== null) parts.push(`ASN=${report.asn}`);
  if (report.asCountry) parts.push(`AS CC=${report.asCountry}`);
  if (report.firstSeen) parts.push(`first=${report.firstSeen}`);
  if (report.lastSeen) parts.push(`last=${report.lastSeen}`);
  if (report.threatFeedCount !== null && report.threatFeedCount > 0) {
    parts.push(`threatfeeds=${report.threatFeedCount}`);
  }
  const asname = report.asname ? ` (${report.asname})` : "";
  return `SANS ISC DShield for ${report.ip}${asname}: ${parts.join(", ") || "on record"}`;
}

/** Pure interpret — report is DshieldLookupSnapshot JSON from run. */
export function interpretDshieldLookupReport(
  report: DshieldLookupSnapshot,
  opts: CapInterpretOpts<DshieldInput>
): CapInterpretResult {
  return interpretObservationClaim({
    entityId: opts.input.entityId,
    text: summarize(report),
    noEntitySummary: "SANS ISC DShield captured; no Entity to attach Claim",
  });
}
