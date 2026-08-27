import { z } from "zod";

import {
  httpToolsError,
  parseToolsError,
  rateLimitedToolsError,
} from "../errors/tools-error";
import { watchdogUserAgent } from "../errors/user-agent";
import { isRecord } from "../parse/coerce";
import { normalizeHost } from "../whois/normalize";

export const trancoLookupSnapshotSchema = z.object({
  domain: z.string().min(1),
  queriedAt: z.string().min(1),
  source: z.literal("tranco-list.eu"),
  found: z.boolean(),
  latestRank: z.number().int().nullable(),
  latestDate: z.string().nullable(),
  ranksCount: z.number().int(),
});

export type TrancoLookupSnapshot = z.infer<typeof trancoLookupSnapshotSchema>;

interface TrancoRankRow {
  date: string;
  rank: number;
}

function parseRanks(value: unknown): TrancoRankRow[] {
  if (!Array.isArray(value)) return [];
  const rows: TrancoRankRow[] = [];
  for (const row of value) {
    if (!isRecord(row)) continue;
    const date = typeof row.date === "string" ? row.date : null;
    let rank: number | null = null;
    if (typeof row.rank === "number") {
      rank = row.rank;
    } else if (typeof row.rank === "string") {
      rank = Math.trunc(Number(row.rank));
    }
    if (date === null || rank === null || !Number.isFinite(rank)) continue;
    rows.push({ date, rank });
  }
  return rows;
}

/**
 * Tranco top-sites ranking history for a domain (past ~30 days of daily lists).
 * GET https://tranco-list.eu/api/ranks/domain/{domain} — rate limit 1 req/s.
 * @see https://tranco-list.eu/api_documentation
 */

interface TrancoOptions {
  userAgent?: string;
}

async function readTrancoBody(
  domain: string,
  signal: AbortSignal,
  ua: string
): Promise<Record<string, unknown>> {
  const res = await fetch(
    `https://tranco-list.eu/api/ranks/domain/${encodeURIComponent(domain)}`,
    {
      method: "GET",
      signal,
      headers: { Accept: "application/json", "User-Agent": ua },
    }
  );

  if (res.status === 429) {
    throw rateLimitedToolsError("Tranco", domain);
  }
  if (res.status === 403) {
    throw httpToolsError(
      "Tranco",
      res.status,
      `Tranco temporarily unavailable for ${domain}`
    );
  }
  if (!res.ok) {
    throw httpToolsError(
      "Tranco API",
      res.status,
      `Tranco API ${res.status} for ${domain}`
    );
  }

  const body: unknown = await res.json();
  if (!isRecord(body)) {
    throw parseToolsError("Tranco", domain);
  }
  return body;
}

export async function fetchTrancoLookup(
  domainRaw: string,
  signal: AbortSignal,
  options?: TrancoOptions
): Promise<TrancoLookupSnapshot> {
  const domain = normalizeHost(domainRaw);
  const ua = options?.userAgent ?? watchdogUserAgent("network.tranco.lookup");

  const body = await readTrancoBody(domain, signal, ua);
  const rows = parseRanks(body.ranks).sort((a, b) =>
    b.date.localeCompare(a.date)
  );
  const latest = rows[0] ?? null;

  return trancoLookupSnapshotSchema.parse({
    domain,
    queriedAt: new Date().toISOString(),
    source: "tranco-list.eu",
    found: rows.length > 0,
    latestRank: latest?.rank ?? null,
    latestDate: latest?.date ?? null,
    ranksCount: rows.length,
  });
}
