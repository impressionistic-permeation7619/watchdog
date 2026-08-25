import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretTypedIdentifiers } from "../../lib/collect/interpret-typed-identifiers";
import type { hackertargetLookupInput } from "./input";
import type { HackertargetLookupSnapshot } from "./report-schema";

type HtInput = z.infer<typeof hackertargetLookupInput>;

function summarize(report: HackertargetLookupSnapshot): string {
  const err = report.error ? `; error=${report.error}` : "";
  return `HackerTarget reverse-IP for ${report.ip}: ${report.domains.length} host(s)${err}`;
}

/** Pure interpret — co-hosted hostnames as domain Identifiers when Entity set. */
export function interpretHackertargetLookupReport(
  report: HackertargetLookupSnapshot,
  opts: CapInterpretOpts<HtInput>
): CapInterpretResult {
  return interpretTypedIdentifiers({
    entityId: opts.input.entityId,
    type: "domain",
    values: report.domains,
    claimText: summarize(report),
    noEntitySummary:
      "HackerTarget reverse-IP captured; no Entity to attach Identifiers",
    limit: 80,
  });
}
