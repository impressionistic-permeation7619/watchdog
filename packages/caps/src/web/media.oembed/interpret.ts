import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";
import type { OembedSnapshot } from "@watchdog/tools";

import { interpretIdentifierBatches } from "../../lib/collect/interpret-identifier-batches";
import type { mediaOembedInput } from "./input";

type Input = z.infer<typeof mediaOembedInput>;

function summarize(report: OembedSnapshot): string {
  const vendor = report.vendor ?? "unknown";
  if (report.error) {
    return `oEmbed ${vendor} ${report.url}: ${report.error}`;
  }
  const bits: string[] = [];
  if (report.title) bits.push(`title=${report.title}`);
  if (report.authorName) bits.push(`author=${report.authorName}`);
  if (report.authorUrl) bits.push(`author_url=${report.authorUrl}`);
  return `oEmbed ${vendor} ${report.url}${bits.length > 0 ? `: ${bits.join("; ")}` : ""}`;
}

/** Pure interpret — handle + URL Identifiers when Entity set. */
export function interpretOembedReport(
  report: OembedSnapshot,
  opts: CapInterpretOpts<Input>
): CapInterpretResult {
  const handleValues =
    report.vendor && report.authorName
      ? [
          report.authorName.startsWith("@")
            ? report.authorName
            : `@${report.authorName}`,
        ]
      : [];
  const urlValues = [report.authorUrl, report.url].filter(
    (v): v is string => v !== null && v !== ""
  );
  return interpretIdentifierBatches({
    entityId: opts.input.entityId,
    batches: [
      {
        type: "handle",
        values: handleValues,
        platform: report.vendor ?? undefined,
      },
      { type: "url", values: urlValues },
    ],
    claimText: summarize(report),
    noEntitySummary: "Media oEmbed captured; no Entity to attach",
  });
}
