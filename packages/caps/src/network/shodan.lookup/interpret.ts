import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretTypedIdentifiers } from "../../lib/collect/interpret-typed-identifiers";
import type { shodanLookupInput } from "./input";
import type { ShodanLookupSnapshot } from "./report-schema";

type ShodanInput = z.infer<typeof shodanLookupInput>;

function summarize(report: ShodanLookupSnapshot): string {
  if (!report.found) {
    return `Shodan for ${report.ip}: not found`;
  }
  const parts: string[] = [`Shodan for ${report.ip}`];
  if (report.org) parts.push(`org=${report.org}`);
  if (report.asn) parts.push(`asn=${report.asn}`);
  if (report.ports.length > 0) {
    parts.push(`ports=${report.ports.join(",")}`);
  }
  return parts.join("; ");
}

/** Pure interpret — report is ShodanLookupSnapshot JSON from run. */
export function interpretShodanLookupReport(
  report: ShodanLookupSnapshot,
  opts: CapInterpretOpts<ShodanInput>
): CapInterpretResult {
  return interpretTypedIdentifiers({
    entityId: opts.input.entityId,
    type: "domain",
    values: report.hostnames,
    claimText: summarize(report),
    noEntitySummary: "Shodan lookup captured; no Entity to attach Identifiers",
  });
}
