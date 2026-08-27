import { z } from "zod";

import { normalizeIp } from "../dns/reverse";
import { httpToolsError, ToolsError } from "../errors/tools-error";
import { asString, isRecord } from "../parse/coerce";
import { watchdogUserAgent } from "../errors/user-agent";

export const bgprankingLookupSnapshotSchema = z.object({
  ip: z.string().min(1),
  queriedAt: z.string().min(1),
  source: z.literal("bgpranking-ng.circl.lu"),
  found: z.boolean(),
  asn: z.number().int().nullable(),
  asnDescription: z.string().nullable(),
  asnRank: z.number().nullable(),
  asnPosition: z.number().int().nullable(),
});

export type BgprankingLookupSnapshot = z.infer<
  typeof bgprankingLookupSnapshotSchema
>;

function toAsnNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Math.trunc(Number(value.trim()));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Most recent {asn} for `ip` from CIRCL's IP→ASN history, or null if unmapped. */
async function fetchLatestAsn(
  ip: string,
  signal: AbortSignal,
  ua: string
): Promise<number | null> {
  const url = new URL("https://bgpranking-ng.circl.lu/ipasn_history/");
  url.searchParams.set("ip", ip);

  const res = await fetch(url, {
    method: "GET",
    signal,
    headers: { Accept: "application/json", "User-Agent": ua },
  });
  if (!res.ok) {
    throw httpToolsError(
      "BGP Ranking ipasn_history API",
      res.status,
      `BGP Ranking ipasn_history API ${res.status} for ${ip}`
    );
  }

  const body: unknown = await res.json();
  if (!isRecord(body)) {
    throw new ToolsError(
      `BGP Ranking response for ${ip} was not a JSON object`,
      {
        code: "parse_error",
      }
    );
  }
  const entries = isRecord(body.response) ? body.response : {};
  const latestTimestamp = Object.keys(entries).sort().at(-1);
  if (!latestTimestamp) return null;
  const entry = entries[latestTimestamp];
  return toAsnNumber(isRecord(entry) ? entry.asn : undefined);
}

type AsnRankingResult = {
  asnDescription: string | null;
  asnRank: number | null;
  asnPosition: number | null;
};

async function fetchAsnRanking(
  asn: number,
  signal: AbortSignal,
  ua: string
): Promise<AsnRankingResult> {
  const res = await fetch("https://bgpranking-ng.circl.lu/json/asn", {
    method: "POST",
    signal,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": ua,
    },
    body: JSON.stringify({ asn: String(asn) }),
  });
  if (!res.ok) {
    throw httpToolsError(
      "BGP Ranking asn API",
      res.status,
      `BGP Ranking asn API ${res.status} for AS${asn}`
    );
  }

  const body: unknown = await res.json();
  if (!isRecord(body)) {
    throw new ToolsError(
      `BGP Ranking response for AS${asn} was not a JSON object`,
      {
        code: "parse_error",
      }
    );
  }
  const resp = isRecord(body.response) ? body.response : {};
  const ranking = isRecord(resp.ranking) ? resp.ranking : {};
  return {
    asnDescription: asString(resp.asn_description),
    asnRank: typeof ranking.rank === "number" ? ranking.rank : null,
    asnPosition: typeof ranking.position === "number" ? ranking.position : null,
  };
}

/**
 * CIRCL BGP Ranking — IP → ASN (via IP-ASN-History) → malicious-activity rank.
 * GET https://bgpranking-ng.circl.lu/ipasn_history/?ip={ip}
 * POST https://bgpranking-ng.circl.lu/json/asn {"asn": N}
 * @see https://github.com/D4-project/bgp-ranking
 */

type BgprankingOptions = { userAgent?: string };
export async function fetchBgprankingLookup(
  ipRaw: string,
  signal: AbortSignal,
  options?: BgprankingOptions
): Promise<BgprankingLookupSnapshot> {
  const ip = normalizeIp(ipRaw);
  const ua =
    options?.userAgent ?? watchdogUserAgent("threat.bgpranking.lookup");

  const asn = await fetchLatestAsn(ip, signal, ua);
  if (asn === null) {
    return bgprankingLookupSnapshotSchema.parse({
      ip,
      queriedAt: new Date().toISOString(),
      source: "bgpranking-ng.circl.lu",
      found: false,
      asn: null,
      asnDescription: null,
      asnRank: null,
      asnPosition: null,
    });
  }

  const { asnDescription, asnRank, asnPosition } = await fetchAsnRanking(
    asn,
    signal,
    ua
  );

  return bgprankingLookupSnapshotSchema.parse({
    ip,
    queriedAt: new Date().toISOString(),
    source: "bgpranking-ng.circl.lu",
    found: true,
    asn,
    asnDescription,
    asnRank,
    asnPosition,
  });
}
