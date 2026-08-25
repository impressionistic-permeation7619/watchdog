import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretTypedIdentifiers } from "../../lib/collect/interpret-typed-identifiers";
import type { leakixLookupInput } from "./input";
import type { LeakixLookupSnapshot } from "./report-schema";

type LeakixInput = z.infer<typeof leakixLookupInput>;

function summarize(report: LeakixLookupSnapshot): string {
  if (!report.found) {
    return `LeakIX for ${report.query}: no exposed services or leaks indexed`;
  }
  const parts = [
    `${report.serviceCount} service(s)`,
    `${report.leakCount} leak(s)`,
  ];
  if (report.protocols.length > 0) {
    parts.push(`protocols: ${report.protocols.join(", ")}`);
  }
  return `LeakIX for ${report.query}: ${parts.join("; ")}`;
}

/** Pure interpret — report is LeakixLookupSnapshot JSON from run. */
export function interpretLeakixLookupReport(
  report: LeakixLookupSnapshot,
  opts: CapInterpretOpts<LeakixInput>
): CapInterpretResult {
  return interpretTypedIdentifiers({
    entityId: opts.input.entityId,
    type: "domain",
    values: report.hostnames,
    claimText: summarize(report),
    noEntitySummary: "LeakIX lookup captured; no Entity to attach Claim",
  });
}
