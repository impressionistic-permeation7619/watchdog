import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretIdentifierBatches } from "../../lib/collect/interpret-identifier-batches";
import type { ipctlLookupInput } from "./input";
import type { IpctlLookupSnapshot } from "./report-schema";

type IpctlInput = z.infer<typeof ipctlLookupInput>;

function summarize(report: IpctlLookupSnapshot): string {
  const parts: string[] = [`IP ${report.ip}`];
  if (report.asn !== null) parts.push(`ASN=${report.asn}`);
  if (report.asName) parts.push(`asName=${report.asName}`);
  if (report.bgpPrefix) parts.push(`prefix=${report.bgpPrefix}`);
  if (report.rirCountryCode) parts.push(`RIR CC=${report.rirCountryCode}`);
  if (report.rir) parts.push(`registry=${report.rir}`);
  if (report.rpkiStatus) parts.push(`RPKI=${report.rpkiStatus}`);
  if (report.reverseDns) parts.push(`PTR=${report.reverseDns}`);
  if (report.geoCountryCode || report.geoCity || report.geoCountryName) {
    const geo = [
      report.geoCity,
      report.geoRegion,
      report.geoCountryName ?? report.geoCountryCode,
    ]
      .filter(Boolean)
      .join(", ");
    parts.push(`GeoIP≈${geo}`);
  }
  if (report.tags.length > 0) {
    parts.push(`tags=${report.tags.slice(0, 8).join(",")}`);
  }
  if (report.threatScore !== null) {
    parts.push(`threat_score=${report.threatScore}`);
  }
  if (parts.length === 1) return `IP ${report.ip}: no ipctl BGP data`;
  return parts.join("; ");
}

/** Pure interpret — seed ip + PTR domain when present. */
export function interpretIpctlLookupReport(
  report: IpctlLookupSnapshot,
  opts: CapInterpretOpts<IpctlInput>
): CapInterpretResult {
  return interpretIdentifierBatches({
    entityId: opts.input.entityId,
    batches: [
      { type: "ip", values: [report.ip] },
      { type: "domain", values: [report.reverseDns] },
    ],
    claimText: summarize(report),
    noEntitySummary: "ipctl lookup captured; no Entity to attach Claim",
  });
}
