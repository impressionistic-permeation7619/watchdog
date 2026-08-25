import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretTypedIdentifiers } from "../../lib/collect/interpret-typed-identifiers";
import type { dnsReverseInput } from "./input";
import type { DnsReverseSnapshot } from "./report-schema";

type ReverseInput = z.infer<typeof dnsReverseInput>;

function summarize(report: DnsReverseSnapshot): string {
  if (report.hostnames.length === 0) {
    return `PTR for ${report.ip}: none`;
  }
  return `PTR for ${report.ip}: ${report.hostnames.join(", ")}`;
}

/** Pure interpret — report is DnsReverseSnapshot JSON from run. */
export function interpretDnsReverseReport(
  report: DnsReverseSnapshot,
  opts: CapInterpretOpts<ReverseInput>
): CapInterpretResult {
  return interpretTypedIdentifiers({
    entityId: opts.input.entityId,
    type: "domain",
    values: report.hostnames,
    claimText: summarize(report),
    noEntitySummary: "PTR captured; no Entity to attach Identifiers",
  });
}
