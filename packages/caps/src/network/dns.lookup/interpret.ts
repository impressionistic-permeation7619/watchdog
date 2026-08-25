import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";
import type { DnsRecords } from "@watchdog/tools";

import { interpretIdentifierBatches } from "../../lib/collect/interpret-identifier-batches";
import type { dnsLookupInput } from "./input";

type DnsInput = z.infer<typeof dnsLookupInput>;

function summarize(snap: DnsRecords): string {
  const parts: string[] = [];
  if (snap.a.length) parts.push(`A=${snap.a.join(",")}`);
  if (snap.aaaa.length) parts.push(`AAAA=${snap.aaaa.join(",")}`);
  if (snap.mx.length) {
    parts.push(
      `MX=${snap.mx.map((m) => `${m.priority}:${m.exchange}`).join(",")}`
    );
  }
  if (snap.ns.length) parts.push(`NS=${snap.ns.join(",")}`);
  return parts.length ? parts.join("; ") : "no records";
}

/** Pure interpret — A/AAAA as ip Identifiers; NS/MX stay in the Claim. */
export function interpretDnsReport(
  report: DnsRecords,
  opts: CapInterpretOpts<DnsInput>
): CapInterpretResult {
  const text = `DNS for ${report.host}: ${summarize(report)}`;
  return interpretIdentifierBatches({
    entityId: opts.input.entityId,
    batches: [{ type: "ip", values: [...report.a, ...report.aaaa] }],
    claimText: text,
    noEntitySummary: "DNS captured; no Entity to attach Identifiers",
  });
}
