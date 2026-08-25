import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretObservationClaim } from "../../lib/collect/interpret-observation-claim";
import type { otxLookupInput } from "./input";
import type { OtxLookupSnapshot } from "./report-schema";

type OtxInput = z.infer<typeof otxLookupInput>;

function summarize(report: OtxLookupSnapshot): string {
  if (!report.found) {
    return `OTX (AlienVault) for ${report.query}: no pulse hits`;
  }
  const families =
    report.malwareFamilies.length > 0
      ? ` — malware: ${report.malwareFamilies.slice(0, 3).join(", ")}`
      : "";
  const pulses =
    report.pulseNames.length > 0
      ? `; pulses: ${report.pulseNames.slice(0, 3).join(", ")}`
      : "";
  return `OTX (AlienVault) for ${report.query}: ${report.pulseCount} pulse(s)${families}${pulses}`;
}

/** Pure interpret — report is OtxLookupSnapshot JSON from run. */
export function interpretOtxLookupReport(
  report: OtxLookupSnapshot,
  opts: CapInterpretOpts<OtxInput>
): CapInterpretResult {
  return interpretObservationClaim({
    entityId: opts.input.entityId,
    text: summarize(report),
    noEntitySummary: "OTX lookup captured; no Entity to attach Claim",
  });
}
