import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";
import type { ArchiveSubmitSnapshot } from "@watchdog/tools";

import { interpretObservationClaim } from "../../lib/collect/interpret-observation-claim";
import type { archiveUrlSubmitInput } from "./input";

type SubmitInput = z.infer<typeof archiveUrlSubmitInput>;

function summarize(snap: ArchiveSubmitSnapshot): string {
  const r = snap.results[0];
  if (!r) return `Archive submit for ${snap.url}: no result`;
  const urlBit = r.archiveUrl ?? "no archive URL";
  return `Archive submit for ${snap.url}: wayback accepted=${r.accepted} (${urlBit})`;
}

/** Pure interpret — report is ArchiveSubmitSnapshot JSON from run. */
export function interpretArchiveUrlSubmitReport(
  report: ArchiveSubmitSnapshot,
  opts: CapInterpretOpts<SubmitInput>
): CapInterpretResult {
  return interpretObservationClaim({
    entityId: opts.input.entityId,
    text: summarize(report),
    noEntitySummary:
      "Archive submit completed; no Entity to attach Claim (public archive record may still exist)",
  });
}
