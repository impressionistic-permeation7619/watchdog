import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";
import type { WaybackLookupSnapshot } from "@watchdog/tools";

import { interpretObservationClaim } from "../../lib/collect/interpret-observation-claim";
import type { waybackLookupInput } from "./input";

type Input = z.infer<typeof waybackLookupInput>;

export function interpretWaybackLookupReport(
  report: WaybackLookupSnapshot,
  opts: CapInterpretOpts<Input>
): CapInterpretResult {
  const text = `Wayback history for ${report.url}: ${report.rows.length} snapshot(s); closest=${report.closestTimestamp ?? "none"}`;
  return interpretObservationClaim({
    entityId: opts.input.entityId,
    text,
    noEntitySummary: "Wayback history captured; no Entity to attach Claim",
  });
}
