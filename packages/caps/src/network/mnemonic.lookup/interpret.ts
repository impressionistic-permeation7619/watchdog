import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretIdentifierBatches } from "../../lib/collect/interpret-identifier-batches";
import type { mnemonicLookupInput } from "./input";
import type { MnemonicLookupSnapshot } from "./report-schema";

type MnemonicInput = z.infer<typeof mnemonicLookupInput>;

function summarize(report: MnemonicLookupSnapshot): string {
  const count =
    report.count === null
      ? `${report.records.length} record(s)`
      : `count≈${report.count}`;
  if (report.kind === "ip") {
    return `Mnemonic PDNS for IP ${report.query}: ${count}; ${report.domains.length} domain(s)`;
  }
  return `Mnemonic PDNS for ${report.query}: ${count}; ${report.ips.length} IP(s), ${report.domains.length} related domain(s)`;
}

/** Pure interpret — report is MnemonicLookupSnapshot JSON from run. */
export function interpretMnemonicLookupReport(
  report: MnemonicLookupSnapshot,
  opts: CapInterpretOpts<MnemonicInput>
): CapInterpretResult {
  return interpretIdentifierBatches({
    entityId: opts.input.entityId,
    batches: [
      { type: "domain", values: report.domains, limit: 80 },
      { type: "ip", values: report.ips, limit: 80 },
    ],
    claimText: summarize(report),
    noEntitySummary: "Mnemonic PDNS captured; no Entity to attach Identifiers",
  });
}
