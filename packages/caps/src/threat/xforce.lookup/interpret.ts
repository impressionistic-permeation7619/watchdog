import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretObservationClaim } from "../../lib/collect/interpret-observation-claim";
import type { xforceLookupInput } from "./input";
import type { XforceLookupSnapshot } from "./report-schema";

type XforceInput = z.infer<typeof xforceLookupInput>;

function summarize(report: XforceLookupSnapshot): string {
  if (!report.found) {
    return `IBM X-Force Exchange for ${report.query}: no report on file`;
  }
  const parts: string[] = [];
  if (report.score !== null) parts.push(`score=${report.score}`);
  const cats = Object.keys(report.cats);
  if (cats.length > 0) parts.push(`cats=${cats.slice(0, 3).join(",")}`);
  if (report.malwareCount > 0) parts.push(`malware=${report.malwareCount}`);
  return `IBM X-Force Exchange for ${report.query}: ${parts.join("; ") || "report on file"}`;
}

/** Pure interpret — report is XforceLookupSnapshot JSON from run. */
export function interpretXforceLookupReport(
  report: XforceLookupSnapshot,
  opts: CapInterpretOpts<XforceInput>
): CapInterpretResult {
  return interpretObservationClaim({
    entityId: opts.input.entityId,
    text: summarize(report),
    noEntitySummary: "X-Force lookup captured; no Entity to attach Claim",
  });
}
