import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretObservationClaim } from "../../lib/collect/interpret-observation-claim";
import type { cymruMhrLookupInput } from "./input";
import type { CymruMhrLookupSnapshot } from "./report-schema";

type CymruMhrInput = z.infer<typeof cymruMhrLookupInput>;

function summarize(report: CymruMhrLookupSnapshot): string {
  if (!report.found) {
    return `Team Cymru MHR for ${report.hash}: not in the malware hash registry`;
  }
  const detection =
    report.detectionPct === null
      ? ""
      : `, AV detection=${report.detectionPct}%`;
  const lastSeen =
    report.lastSeenEpoch === null
      ? ""
      : `, last seen ${new Date(report.lastSeenEpoch * 1000).toISOString()}`;
  return `Team Cymru MHR for ${report.hash}: known malware hash${detection}${lastSeen}`;
}

/** Pure interpret — report is CymruMhrLookupSnapshot JSON from run. */
export function interpretCymruMhrLookupReport(
  report: CymruMhrLookupSnapshot,
  opts: CapInterpretOpts<CymruMhrInput>
): CapInterpretResult {
  return interpretObservationClaim({
    entityId: opts.input.entityId,
    text: summarize(report),
    noEntitySummary:
      "Team Cymru MHR lookup captured; no Entity to attach Claim",
  });
}
