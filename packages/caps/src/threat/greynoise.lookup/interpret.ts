import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretObservationClaim } from "../../lib/collect/interpret-observation-claim";
import type { greynoiseLookupInput } from "./input";
import type { GreynoiseLookupSnapshot } from "./report-schema";

type GreynoiseInput = z.infer<typeof greynoiseLookupInput>;

function summarize(report: GreynoiseLookupSnapshot): string {
  const parts: string[] = [`IP ${report.ip}`];
  if (report.noise !== null) parts.push(`noise=${report.noise}`);
  if (report.riot !== null) parts.push(`RIOT=${report.riot}`);
  if (report.classification) parts.push(`class=${report.classification}`);
  if (report.name) parts.push(`name=${report.name}`);
  if (report.lastSeen) parts.push(`lastSeen=${report.lastSeen}`);
  if (report.message && report.noise !== true && report.riot !== true) {
    parts.push(report.message);
  }
  return `GreyNoise Community: ${parts.join("; ")}`;
}

/** Pure interpret — report is GreynoiseLookupSnapshot JSON from run. */
export function interpretGreynoiseLookupReport(
  report: GreynoiseLookupSnapshot,
  opts: CapInterpretOpts<GreynoiseInput>
): CapInterpretResult {
  return interpretObservationClaim({
    entityId: opts.input.entityId,
    text: summarize(report),
    noEntitySummary: "GreyNoise lookup captured; no Entity to attach Claim",
  });
}
