import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";
import type { IpinfoLookupSnapshot } from "@watchdog/tools";

import { interpretIdentifierBatches } from "../../lib/collect/interpret-identifier-batches";
import type { ipinfoLookupInput } from "./input";

type IpinfoInput = z.infer<typeof ipinfoLookupInput>;

function summarize(report: IpinfoLookupSnapshot): string {
  if (!report.found) {
    return `IPinfo for ${report.ip}: no geo/org record`;
  }
  const place = [report.city, report.region, report.country]
    .filter((v): v is string => v !== null)
    .join(", ");
  const org = report.org ? `, org ${report.org}` : "";
  const host = report.hostname ? `; hostname=${report.hostname}` : "";
  return `IPinfo for ${report.ip}: ${place || "location unknown"}${org}${host}`;
}

/** Pure interpret — seed ip + hostname as domain when present. */
export function interpretIpinfoLookupReport(
  report: IpinfoLookupSnapshot,
  opts: CapInterpretOpts<IpinfoInput>
): CapInterpretResult {
  return interpretIdentifierBatches({
    entityId: opts.input.entityId,
    batches: [
      { type: "ip", values: [report.ip] },
      { type: "domain", values: report.found ? [report.hostname] : [] },
    ],
    claimText: summarize(report),
    noEntitySummary: "IPinfo lookup captured; no Entity to attach Claim",
  });
}
