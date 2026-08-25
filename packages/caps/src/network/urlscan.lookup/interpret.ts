import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretIdentifierBatches } from "../../lib/collect/interpret-identifier-batches";
import type { urlscanLookupInput } from "./input";
import type { UrlscanLookupSnapshot } from "./report-schema";

type UrlscanInput = z.infer<typeof urlscanLookupInput>;

function summarize(report: UrlscanLookupSnapshot): string {
  const total =
    report.total === null
      ? `${report.hits.length} hit(s)`
      : `total≈${report.total}`;
  return `URLScan search for ${report.host}: ${total}; ${report.urls.length} URL(s), ${report.domains.length} domain(s)`;
}

/** Pure interpret — past-scan URLs + domains as Identifiers when Entity set. */
export function interpretUrlscanLookupReport(
  report: UrlscanLookupSnapshot,
  opts: CapInterpretOpts<UrlscanInput>
): CapInterpretResult {
  return interpretIdentifierBatches({
    entityId: opts.input.entityId,
    batches: [
      { type: "url", values: report.urls, limit: 40 },
      { type: "domain", values: report.domains, limit: 40 },
    ],
    claimText: summarize(report),
    noEntitySummary: "URLScan search captured; no Entity to attach Identifiers",
  });
}
