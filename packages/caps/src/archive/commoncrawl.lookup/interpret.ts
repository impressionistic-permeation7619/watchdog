import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretIdentifierBatches } from "../../lib/collect/interpret-identifier-batches";
import type { commoncrawlLookupInput } from "./input";
import type { CommoncrawlLookupSnapshot } from "./report-schema";

type CcInput = z.infer<typeof commoncrawlLookupInput>;

function summarize(report: CommoncrawlLookupSnapshot): string {
  return `Common Crawl for ${report.host}: ${report.urls.length} URL(s) across ${report.indexes.join(", ") || "no indexes"}`;
}

/** Pure interpret — crawl URLs as url Identifiers when Entity set. */
export function interpretCommoncrawlLookupReport(
  report: CommoncrawlLookupSnapshot,
  opts: CapInterpretOpts<CcInput>
): CapInterpretResult {
  return interpretIdentifierBatches({
    entityId: opts.input.entityId,
    batches: [{ type: "url", values: report.urls, limit: 40 }],
    claimText: summarize(report),
    noEntitySummary:
      "Common Crawl lookup captured; no Entity to attach Identifiers",
  });
}
