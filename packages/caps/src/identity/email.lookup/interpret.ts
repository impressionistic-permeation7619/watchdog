import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretIdentifierBatches } from "../../lib/collect/interpret-identifier-batches";
import type { emailLookupInput } from "./input";
import type { EmailLookupSnapshot } from "./report-schema";

type EmailInput = z.infer<typeof emailLookupInput>;

function summarize(report: EmailLookupSnapshot): string {
  const parts = [
    `domain=${report.domain}`,
    report.providerHint ? `provider=${report.providerHint}` : "provider=?",
    `MX=${report.mx.length}`,
    report.spfPresent ? "SPF" : "no-SPF",
    report.dmarcPresent ? "DMARC" : "no-DMARC",
  ];
  return `Email lookup for ${report.email}: ${parts.join("; ")}`;
}

/** Pure interpret — email + domain Identifiers when Entity set. */
export function interpretEmailLookupReport(
  report: EmailLookupSnapshot,
  opts: CapInterpretOpts<EmailInput>
): CapInterpretResult {
  return interpretIdentifierBatches({
    entityId: opts.input.entityId,
    batches: [
      { type: "email", values: [report.email] },
      { type: "domain", values: [report.domain] },
    ],
    claimText: summarize(report),
    noEntitySummary: "Email lookup captured; no Entity to attach Identifiers",
  });
}
