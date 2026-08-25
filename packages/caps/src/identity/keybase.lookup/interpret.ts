import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretIdentifierBatches } from "../../lib/collect/interpret-identifier-batches";
import type { keybaseLookupInput } from "./input";
import type { KeybaseLookupSnapshot } from "./report-schema";

type KeybaseInput = z.infer<typeof keybaseLookupInput>;

const URL_LIMIT = 40;

function summarize(report: KeybaseLookupSnapshot): string {
  if (!report.found) {
    return `Keybase ${report.kind}=${report.query}: not found`;
  }
  const bits: string[] = [`@${report.username ?? "?"}`];
  if (report.fullName) bits.push(`name=${report.fullName}`);
  if (report.proofs.length > 0) {
    bits.push(
      `proofs=${report.proofs
        .map((p) => p.platform)
        .slice(0, 8)
        .join(",")}`
    );
  }
  if (report.pgpFingerprints.length > 0) {
    bits.push(`pgp=${report.pgpFingerprints.length}`);
  }
  return `Keybase: ${bits.join("; ")}`;
}

/** Pure interpret — Keybase handle + optional pgp / crypto / url / domain. */
export function interpretKeybaseLookupReport(
  report: KeybaseLookupSnapshot,
  opts: CapInterpretOpts<KeybaseInput>
): CapInterpretResult {
  const urlValues = report.found
    ? [report.profileUrl, ...report.proofs.map((proof) => proof.url)]
    : [];

  return interpretIdentifierBatches({
    entityId: opts.input.entityId,
    batches: [
      {
        type: "handle",
        values: report.found ? [report.username, ...report.extraUsernames] : [],
        platform: "keybase",
      },
      ...report.proofs.flatMap((proof) =>
        report.found && proof.username
          ? [
              {
                type: "handle" as const,
                values: [proof.username],
                platform: proof.platform,
                limit: 1,
              },
            ]
          : []
      ),
      {
        type: "pgp",
        values: report.found ? report.pgpFingerprints : [],
        limit: 5,
      },
      {
        type: "crypto",
        values: report.found ? report.bitcoinAddresses : [],
        limit: 5,
      },
      { type: "url", values: urlValues, limit: URL_LIMIT },
      {
        type: "domain",
        values: report.kind === "domain" ? [report.query] : [],
      },
    ],
    claimText: summarize(report),
    noEntitySummary: "Keybase lookup captured; no Entity to attach Identifiers",
  });
}
