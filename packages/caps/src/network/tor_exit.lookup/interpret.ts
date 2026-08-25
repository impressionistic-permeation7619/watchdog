import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretObservationClaim } from "../../lib/collect/interpret-observation-claim";
import type { torExitLookupInput } from "./input";
import type { TorExitLookupSnapshot } from "./report-schema";

type TorExitInput = z.infer<typeof torExitLookupInput>;

function summarize(report: TorExitLookupSnapshot): string {
  return report.isExit
    ? `Tor exit-address list: ${report.ip} is a current Tor exit node`
    : `Tor exit-address list: ${report.ip} is not a current Tor exit node`;
}

/** Pure interpret — report is TorExitLookupSnapshot JSON from run. */
export function interpretTorExitLookupReport(
  report: TorExitLookupSnapshot,
  opts: CapInterpretOpts<TorExitInput>
): CapInterpretResult {
  return interpretObservationClaim({
    entityId: opts.input.entityId,
    text: summarize(report),
    noEntitySummary: "Tor exit-list check captured; no Entity to attach Claim",
  });
}
