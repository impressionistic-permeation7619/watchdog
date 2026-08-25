import type { z } from "zod";

import type { CapInterpretOpts, CapInterpretResult } from "@watchdog/cap-sdk";

import { interpretIdentifierBatches } from "../../lib/collect/interpret-identifier-batches";
import type { gravatarLookupInput } from "./input";
import type { GravatarLookupSnapshot } from "./report-schema";

type GravatarInput = z.infer<typeof gravatarLookupInput>;

const URL_LIMIT = 40;
const EMAIL_LIMIT = 40;

function summarize(report: GravatarLookupSnapshot, urlTotal: number): string {
  if (!report.found) {
    return `Gravatar for ${report.email}: no public profile`;
  }
  const bits: string[] = [];
  if (report.displayName) bits.push(`name=${report.displayName}`);
  if (report.preferredUsername) bits.push(`user=${report.preferredUsername}`);
  if (report.location) bits.push(`loc=${report.location}`);
  bits.push(`accounts=${report.accounts.length}`);
  if (urlTotal > URL_LIMIT) {
    bits.push(`showing ${URL_LIMIT} of ${urlTotal} urls`);
  }
  return `Gravatar for ${report.email}: ${bits.join("; ")}`;
}

/** Pure interpret — email + optional handle / url Identifiers when Entity set. */
export function interpretGravatarLookupReport(
  report: GravatarLookupSnapshot,
  opts: CapInterpretOpts<GravatarInput>
): CapInterpretResult {
  const urlValues = report.found
    ? [report.profileUrl, ...report.accounts.map((account) => account.url)]
    : [];
  const urlTotal = urlValues.filter(
    (value): value is string =>
      value !== null && value !== undefined && value !== ""
  ).length;

  return interpretIdentifierBatches({
    entityId: opts.input.entityId,
    batches: [
      {
        type: "email",
        values: report.found
          ? [report.email, ...report.emails]
          : [report.email],
        limit: EMAIL_LIMIT,
      },
      ...(report.found && report.preferredUsername
        ? [
            {
              type: "handle" as const,
              values: [report.preferredUsername],
              platform: "gravatar",
            },
          ]
        : []),
      ...(report.found
        ? report.accounts.flatMap((account) =>
            account.username
              ? [
                  {
                    type: "handle" as const,
                    values: [account.username],
                    platform: account.shortname ?? "gravatar",
                    limit: 1,
                  },
                ]
              : []
          )
        : []),
      { type: "url", values: urlValues, limit: URL_LIMIT },
    ],
    claimText: summarize(report, urlTotal),
    noEntitySummary:
      "Gravatar lookup captured; no Entity to attach Identifiers",
  });
}
