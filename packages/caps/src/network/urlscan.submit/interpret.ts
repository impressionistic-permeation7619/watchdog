import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";
import type { UrlscanSubmitSnapshot } from "@watchdog/tools";

import { interpretObservationClaim } from "../../lib/collect/interpret-observation-claim";
import type { urlscanSubmitInput } from "./input";

type UrlscanSubmitInput = z.infer<typeof urlscanSubmitInput>;

function summarize(snap: UrlscanSubmitSnapshot): string {
  if (!snap.accepted) {
    return `urlscan.io submit for ${snap.url}: not accepted${snap.message ? ` (${snap.message})` : ""}`;
  }
  const link = snap.resultUrl ?? "no result link yet";
  return `urlscan.io submit for ${snap.url}: accepted (${snap.visibility}) — ${link}`;
}

/** Pure interpret — report is UrlscanSubmitSnapshot JSON from run. */
export function interpretUrlscanSubmitReport(
  report: UrlscanSubmitSnapshot,
  opts: CapInterpretOpts<UrlscanSubmitInput>
): CapInterpretResult {
  return interpretObservationClaim({
    entityId: opts.input.entityId,
    text: summarize(report),
    noEntitySummary: "urlscan.io submit completed; no Entity to attach Claim",
  });
}
