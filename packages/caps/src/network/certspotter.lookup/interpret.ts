import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretTypedIdentifiers } from "../../lib/collect/interpret-typed-identifiers";
import type { certspotterLookupInput } from "./input";
import type { CertspotterLookupSnapshot } from "./report-schema";

type CertspotterInput = z.infer<typeof certspotterLookupInput>;

function summarize(report: CertspotterLookupSnapshot): string {
  return `Cert Spotter for ${report.host}: ${report.issuances.length} issuance(s), ${report.domains.length} domain(s)`;
}

/** Pure interpret — CT dns_names as domain Identifiers when Entity set. */
export function interpretCertspotterLookupReport(
  report: CertspotterLookupSnapshot,
  opts: CapInterpretOpts<CertspotterInput>
): CapInterpretResult {
  return interpretTypedIdentifiers({
    entityId: opts.input.entityId,
    type: "domain",
    values: report.domains,
    claimText: summarize(report),
    noEntitySummary:
      "Cert Spotter lookup captured; no Entity to attach Identifiers",
    limit: 80,
  });
}
