import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretTypedIdentifiers } from "../../lib/collect/interpret-typed-identifiers";
import type { c99LookupInput } from "./input";
import type { C99LookupSnapshot } from "./report-schema";

type C99Input = z.infer<typeof c99LookupInput>;

function summarize(report: C99LookupSnapshot): string {
  const cf = report.hits.filter((h) => h.cloudflare === true).length;
  const err = report.error ? `; error=${report.error}` : "";
  return `C99 for ${report.host}: ${report.domains.length} subdomain(s), cloudflare=${cf}${err}`;
}

/** Pure interpret — subdomain hits as domain Identifiers when Entity set. */
export function interpretC99LookupReport(
  report: C99LookupSnapshot,
  opts: CapInterpretOpts<C99Input>
): CapInterpretResult {
  return interpretTypedIdentifiers({
    entityId: opts.input.entityId,
    type: "domain",
    values: report.domains,
    claimText: summarize(report),
    noEntitySummary: "C99 lookup captured; no Entity to attach Identifiers",
    limit: 80,
  });
}
