import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretIdentifierBatches } from "../../lib/collect/interpret-identifier-batches";
import type { threatfoxLookupInput } from "./input";
import type { ThreatfoxLookupSnapshot } from "./report-schema";

type ThreatfoxInput = z.infer<typeof threatfoxLookupInput>;

const IOC_LIMIT = 40;

function ipv4Host(raw: string): string {
  const port = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/.exec(raw);
  return port?.[1] ?? raw;
}

function iocKind(iocType: string | null): "ip" | "domain" | "url" | null {
  const kind = (iocType ?? "").toLowerCase();
  if (kind.includes("url")) return "url";
  if (kind.includes("domain") || kind === "fqdn") return "domain";
  if (kind.startsWith("ip") || kind === "ipv4" || kind === "ipv6") return "ip";
  return null;
}

function summarize(report: ThreatfoxLookupSnapshot, proposed: number): string {
  if (!report.found) {
    return `ThreatFox (abuse.ch) for ${report.query}: no IOC hits`;
  }
  const top = report.iocs.slice(0, 3).map((i) => {
    const mal = i.malwarePrintable ?? i.malware ?? "?";
    return `${i.iocType ?? "ioc"}/${mal}`;
  });
  const total = report.iocs.length;
  const shownNote =
    proposed < total ? `showing ${proposed} of ${total}` : `${total} IOC(s)`;
  return `ThreatFox (abuse.ch) for ${report.query}: ${shownNote} — ${top.join("; ")}`;
}

/** Pure interpret — report is ThreatfoxLookupSnapshot JSON from run. */
export function interpretThreatfoxLookupReport(
  report: ThreatfoxLookupSnapshot,
  opts: CapInterpretOpts<ThreatfoxInput>
): CapInterpretResult {
  const buckets = {
    ip: [] as string[],
    domain: [] as string[],
    url: [] as string[],
  };
  let proposed = 0;
  for (const ioc of report.iocs) {
    if (proposed >= IOC_LIMIT) break;
    const kind = iocKind(ioc.iocType);
    if (kind === null) continue;
    buckets[kind].push(kind === "ip" ? ipv4Host(ioc.ioc) : ioc.ioc);
    proposed += 1;
  }

  return interpretIdentifierBatches({
    entityId: opts.input.entityId,
    batches: [
      { type: "ip", values: buckets.ip },
      { type: "domain", values: buckets.domain },
      { type: "url", values: buckets.url },
    ],
    claimText: summarize(report, proposed),
    noEntitySummary: "ThreatFox lookup captured; no Entity to attach Claim",
  });
}
