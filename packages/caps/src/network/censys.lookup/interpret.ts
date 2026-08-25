import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretTypedIdentifiers } from "../../lib/collect/interpret-typed-identifiers";
import type { censysLookupInput } from "./input";
import type { CensysLookupSnapshot } from "./report-schema";

type CensysInput = z.infer<typeof censysLookupInput>;

function summarize(report: CensysLookupSnapshot): string {
  if (!report.found) {
    return `Censys for ${report.ip}: not found`;
  }
  const parts: string[] = [`Censys for ${report.ip}`];
  if (report.asn !== null) parts.push(`ASN=${report.asn}`);
  if (report.asName) parts.push(`asName=${report.asName}`);
  if (report.ports.length > 0) {
    parts.push(`ports=${report.ports.join(",")}`);
  }
  if (report.serviceNames.length > 0) {
    const names = report.serviceNames.slice(0, 8);
    const more =
      report.serviceNames.length > names.length
        ? ` (+${report.serviceNames.length - names.length} more)`
        : "";
    parts.push(`services=${names.join(",")}${more}`);
  }
  const location = [report.city, report.countryCode].filter(Boolean).join(", ");
  if (location) parts.push(`location=${location}`);
  return parts.join("; ");
}

/** Pure interpret — report is CensysLookupSnapshot JSON from run. */
export function interpretCensysLookupReport(
  report: CensysLookupSnapshot,
  opts: CapInterpretOpts<CensysInput>
): CapInterpretResult {
  return interpretTypedIdentifiers({
    entityId: opts.input.entityId,
    type: "domain",
    values: report.hostnames,
    claimText: summarize(report),
    noEntitySummary: "Censys lookup captured; no Entity to attach Claim",
  });
}
