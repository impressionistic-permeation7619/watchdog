import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretTypedIdentifiers } from "../../lib/collect/interpret-typed-identifiers";
import type { ctLookupInput } from "./input";
import type { CtLookupSnapshot } from "./report-schema";

type CtInput = z.infer<typeof ctLookupInput>;

function summarize(report: CtLookupSnapshot): string {
  const n = report.domains.length;
  const e = report.entries.length;
  return `CT for ${report.host}: ${e} cert row(s), ${n} domain name(s) via ${report.source}`;
}

/** Pure interpret — report is CtLookupSnapshot JSON from run. */
export function interpretCtReport(
  report: CtLookupSnapshot,
  opts: CapInterpretOpts<CtInput>
): CapInterpretResult {
  return interpretTypedIdentifiers({
    entityId: opts.input.entityId,
    type: "domain",
    values: report.domains,
    claimText: summarize(report),
    noEntitySummary: "CT captured; no Entity to attach Identifiers",
  });
}
