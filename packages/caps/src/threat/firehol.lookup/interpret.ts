import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretObservationClaim } from "../../lib/collect/interpret-observation-claim";
import type { fireholLookupInput } from "./input";
import type { FireholLookupSnapshot } from "./report-schema";

type FireholInput = z.infer<typeof fireholLookupInput>;

function summarize(report: FireholLookupSnapshot): string {
  return report.found
    ? `FireHOL ${report.list}: ${report.ip} is listed (dshield/feodo/fullbogons/spamhaus_drop composite)`
    : `FireHOL ${report.list}: ${report.ip} is not listed`;
}

/** Pure interpret — report is FireholLookupSnapshot JSON from run. */
export function interpretFireholLookupReport(
  report: FireholLookupSnapshot,
  opts: CapInterpretOpts<FireholInput>
): CapInterpretResult {
  return interpretObservationClaim({
    entityId: opts.input.entityId,
    text: summarize(report),
    noEntitySummary:
      "FireHOL blocklist check captured; no Entity to attach Claim",
  });
}
