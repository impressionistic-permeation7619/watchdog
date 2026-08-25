import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretTypedIdentifiers } from "../../lib/collect/interpret-typed-identifiers";
import type { pgpLookupInput } from "./input";
import type { PgpLookupSnapshot } from "./report-schema";

type PgpInput = z.infer<typeof pgpLookupInput>;

function summarize(report: PgpLookupSnapshot): string {
  const src = report.source ?? "none";
  return `PGP for ${report.query}: ${report.keys.length} key(s) via ${src}`;
}

/** Pure interpret — pgp fingerprints as Identifiers when Entity set. */
export function interpretPgpLookupReport(
  report: PgpLookupSnapshot,
  opts: CapInterpretOpts<PgpInput>
): CapInterpretResult {
  return interpretTypedIdentifiers({
    entityId: opts.input.entityId,
    type: "pgp",
    values: report.keys.map((k) => k.fingerprint),
    claimText: summarize(report),
    noEntitySummary: "PGP lookup captured; no Entity to attach Identifiers",
    limit: 20,
  });
}
