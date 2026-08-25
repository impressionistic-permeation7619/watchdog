import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretObservationClaim } from "../../lib/collect/interpret-observation-claim";
import type { bgprankingLookupInput } from "./input";
import type { BgprankingLookupSnapshot } from "./report-schema";

type BgprankingInput = z.infer<typeof bgprankingLookupInput>;

function summarize(report: BgprankingLookupSnapshot): string {
  if (!report.found || report.asn === null) {
    return `CIRCL BGP Ranking for ${report.ip}: ASN unmapped`;
  }
  const desc = report.asnDescription ? ` (${report.asnDescription})` : "";
  const position =
    report.asnPosition === null ? "" : ` (#${report.asnPosition})`;
  const rank =
    report.asnRank === null ? "" : `, rank=${report.asnRank}${position}`;
  return `CIRCL BGP Ranking for ${report.ip}: AS${report.asn}${desc}${rank}`;
}

/** Pure interpret — report is BgprankingLookupSnapshot JSON from run. */
export function interpretBgprankingLookupReport(
  report: BgprankingLookupSnapshot,
  opts: CapInterpretOpts<BgprankingInput>
): CapInterpretResult {
  return interpretObservationClaim({
    entityId: opts.input.entityId,
    text: summarize(report),
    noEntitySummary: "CIRCL BGP Ranking captured; no Entity to attach Claim",
  });
}
