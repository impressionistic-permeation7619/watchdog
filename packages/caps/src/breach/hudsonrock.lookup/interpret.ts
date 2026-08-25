import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretObservationClaim } from "../../lib/collect/interpret-observation-claim";
import type { hudsonrockLookupInput } from "./input";
import type { HudsonrockLookupSnapshot } from "./report-schema";

type HudsonrockInput = z.infer<typeof hudsonrockLookupInput>;

function summarize(report: HudsonrockLookupSnapshot): string {
  if (!report.found) {
    return `Hudson Rock (infostealer exposure) for ${report.query}: no exposure records`;
  }
  const newest = report.newestDate ? `, most recent ${report.newestDate}` : "";
  return `Hudson Rock (infostealer exposure) for ${report.query}: ${report.totalResults} exposure record(s)${newest}`;
}

/** Pure interpret — report is HudsonrockLookupSnapshot JSON from run. */
export function interpretHudsonrockLookupReport(
  report: HudsonrockLookupSnapshot,
  opts: CapInterpretOpts<HudsonrockInput>
): CapInterpretResult {
  return interpretObservationClaim({
    entityId: opts.input.entityId,
    text: summarize(report),
    noEntitySummary: "Hudson Rock lookup captured; no Entity to attach Claim",
  });
}
