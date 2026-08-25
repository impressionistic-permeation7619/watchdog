import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretObservationClaim } from "../../lib/collect/interpret-observation-claim";
import type { greedybearLookupInput } from "./input";
import type { GreedybearLookupSnapshot } from "./report-schema";

type GreedybearInput = z.infer<typeof greedybearLookupInput>;

function summarize(report: GreedybearLookupSnapshot): string {
  return report.found
    ? `GreedyBear (Honeynet) scanner feed: ${report.query} seen scanning honeypots (recent)`
    : `GreedyBear (Honeynet) scanner feed: ${report.query} not seen scanning honeypots (recent)`;
}

/** Pure interpret — report is GreedybearLookupSnapshot JSON from run. */
export function interpretGreedybearLookupReport(
  report: GreedybearLookupSnapshot,
  opts: CapInterpretOpts<GreedybearInput>
): CapInterpretResult {
  return interpretObservationClaim({
    entityId: opts.input.entityId,
    text: summarize(report),
    noEntitySummary: "GreedyBear lookup captured; no Entity to attach Claim",
  });
}
