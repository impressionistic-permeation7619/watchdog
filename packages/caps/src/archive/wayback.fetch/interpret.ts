import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";
import type { WaybackFetchSnapshot } from "@watchdog/tools";

import { interpretObservationClaim } from "../../lib/collect/interpret-observation-claim";
import type { waybackFetchInput } from "./input";

type Input = z.infer<typeof waybackFetchInput>;

export function interpretWaybackFetchReport(
  report: WaybackFetchSnapshot,
  opts: CapInterpretOpts<Input>
): CapInterpretResult {
  const text = `Wayback fetch ${report.timestamp} for ${report.url}: status=${report.status} bytes=${report.byteLength}`;
  return interpretObservationClaim({
    entityId: opts.input.entityId,
    text,
    noEntitySummary: "Wayback snapshot captured; no Entity to attach Claim",
  });
}
