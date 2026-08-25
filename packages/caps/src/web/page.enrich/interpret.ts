import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";
import type { PageEnrichSnapshot } from "@watchdog/tools";

import { interpretIdentifierBatches } from "../../lib/collect/interpret-identifier-batches";
import type { pageEnrichInput } from "./input";

type Input = z.infer<typeof pageEnrichInput>;

export function interpretPageEnrichReport(
  report: PageEnrichSnapshot,
  opts: CapInterpretOpts<Input>
): CapInterpretResult {
  const trackers =
    report.trackers.length > 0
      ? report.trackers.map((t) => t.vendor).join(",")
      : "none";
  const text = `Page enrich ${report.finalUrl}: title=${report.title ?? "?"} trackers=${trackers}`;
  return interpretIdentifierBatches({
    entityId: opts.input.entityId,
    batches: [
      { type: "url", values: [report.finalUrl, report.meta.canonical] },
    ],
    claimText: text,
    noEntitySummary: "Page enrich captured; no Entity to attach Claim",
  });
}
