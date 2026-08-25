import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";
import type { UnshortenSnapshot } from "@watchdog/tools";

import { interpretIdentifierBatches } from "../../lib/collect/interpret-identifier-batches";
import type { urlUnshortenInput } from "./input";

type Input = z.infer<typeof urlUnshortenInput>;

export function interpretUnshortenReport(
  report: UnshortenSnapshot,
  opts: CapInterpretOpts<Input>
): CapInterpretResult {
  const text = `Unshorten ${report.url} → ${report.finalUrl} (${report.hopCount} hop(s))`;
  return interpretIdentifierBatches({
    entityId: opts.input.entityId,
    batches: [
      {
        type: "url",
        values: [report.finalUrl, ...report.chain.map((hop) => hop.url)],
      },
    ],
    claimText: text,
    noEntitySummary: "Unshorten captured; no Entity to attach Claim",
  });
}
