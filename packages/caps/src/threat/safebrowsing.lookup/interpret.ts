import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretObservationClaim } from "../../lib/collect/interpret-observation-claim";
import type { safebrowsingLookupInput } from "./input";
import type { SafebrowsingLookupSnapshot } from "./report-schema";

type SafebrowsingInput = z.infer<typeof safebrowsingLookupInput>;

function summarize(report: SafebrowsingLookupSnapshot): string {
  if (!report.found) {
    return `Google Safe Browsing for ${report.url}: no threat-list hits`;
  }
  const types = [...new Set(report.matches.map((m) => m.threatType))];
  return `Google Safe Browsing for ${report.url}: flagged (${types.join(", ")})`;
}

/** Pure interpret — report is SafebrowsingLookupSnapshot JSON from run. */
export function interpretSafebrowsingLookupReport(
  report: SafebrowsingLookupSnapshot,
  opts: CapInterpretOpts<SafebrowsingInput>
): CapInterpretResult {
  return interpretObservationClaim({
    entityId: opts.input.entityId,
    text: summarize(report),
    noEntitySummary: "Safe Browsing lookup captured; no Entity to attach Claim",
  });
}
