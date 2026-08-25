import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretObservationClaim } from "../../lib/collect/interpret-observation-claim";
import type { honeydbLookupInput } from "./input";
import type { HoneydbLookupSnapshot } from "./report-schema";

type HoneydbInput = z.infer<typeof honeydbLookupInput>;

function summarize(report: HoneydbLookupSnapshot): string {
  if (!report.found) {
    return `HoneyDB: ${report.ip}: not seen`;
  }
  const parts: string[] = [`IP ${report.ip}`];
  if (report.asn !== null) parts.push(`ASN${report.asn}`);
  if (report.country) parts.push(report.country);
  if (report.isTor) parts.push("Tor");
  if (report.isThreat) parts.push("threat-listed");
  if (report.internetScanner) parts.push("internet-scanner");
  if (report.historyEventCount > 0) {
    parts.push(`${report.historyEventCount} honeypot event(s)`);
  }
  return `HoneyDB: ${parts.join("; ")}`;
}

/** Pure interpret — report is HoneydbLookupSnapshot JSON from run. */
export function interpretHoneydbLookupReport(
  report: HoneydbLookupSnapshot,
  opts: CapInterpretOpts<HoneydbInput>
): CapInterpretResult {
  return interpretObservationClaim({
    entityId: opts.input.entityId,
    text: summarize(report),
    noEntitySummary: "HoneyDB lookup captured; no Entity to attach Claim",
  });
}
