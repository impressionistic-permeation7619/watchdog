import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretObservationClaim } from "../../lib/collect/interpret-observation-claim";
import type { feodoLookupInput } from "./input";
import type { FeodoLookupSnapshot } from "./report-schema";

type FeodoInput = z.infer<typeof feodoLookupInput>;

function summarize(report: FeodoLookupSnapshot): string {
  if (!report.found) {
    return `Feodo Tracker (abuse.ch) for ${report.ip}: not listed`;
  }
  const parts: string[] = [`IP ${report.ip}`];
  if (report.malware) parts.push(report.malware);
  if (report.status) parts.push(`status=${report.status}`);
  if (report.lastOnline) parts.push(`lastOnline=${report.lastOnline}`);
  return `Feodo Tracker (abuse.ch) C2 listing: ${parts.join("; ")}`;
}

/** Pure interpret — report is FeodoLookupSnapshot JSON from run. */
export function interpretFeodoLookupReport(
  report: FeodoLookupSnapshot,
  opts: CapInterpretOpts<FeodoInput>
): CapInterpretResult {
  return interpretObservationClaim({
    entityId: opts.input.entityId,
    text: summarize(report),
    noEntitySummary: "Feodo Tracker lookup captured; no Entity to attach Claim",
  });
}
