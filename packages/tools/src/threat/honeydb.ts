import { z } from "zod";

import { normalizeIp } from "../dns/reverse";
import {
  httpToolsError,
  parseToolsError,
  rateLimitedToolsError,
  validationToolsError,
} from "../errors/tools-error";
import { asString, isRecord } from "../parse/coerce";
import { watchdogUserAgent } from "../errors/user-agent";

export const honeydbLookupSnapshotSchema = z.object({
  ip: z.string().min(1),
  queriedAt: z.string().min(1),
  source: z.literal("honeydb.io"),
  found: z.boolean(),
  asn: z.number().int().nullable(),
  country: z.string().nullable(),
  isTor: z.boolean(),
  isThreat: z.boolean(),
  internetScanner: z.boolean(),
  historyEventCount: z.number().int(),
});

export type HoneydbLookupSnapshot = z.infer<typeof honeydbLookupSnapshotSchema>;

function toEventCount(raw: unknown): number {
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") return Number(raw);
  return Number.NaN;
}

function sumHistoryEvents(rows: unknown): number {
  if (!Array.isArray(rows)) return 0;
  let total = 0;
  for (const row of rows) {
    if (!isRecord(row)) continue;
    const n = toEventCount(row.event_count);
    if (Number.isFinite(n)) total += n;
  }
  return total;
}

/**
 * HoneyDB `ip-context` — network info + threat-list flags + honeypot
 * observation history for an IP. Community feed (~1000 req/day),
 * non-commercial ToS.
 * GET https://honeydb.io/api/ip-context/{ip}
 * @see https://honeydb.io/mssp-aisoc
 */
export async function fetchHoneydbLookup(
  ipRaw: string,
  apiId: string,
  apiKey: string,
  signal: AbortSignal,
  options?: { userAgent?: string }
): Promise<HoneydbLookupSnapshot> {
  const ip = normalizeIp(ipRaw);
  const id = apiId.trim();
  const key = apiKey.trim();
  if (!id || !key) {
    throw validationToolsError("HONEYDB_API_ID and HONEYDB_API_KEY required");
  }

  const ua =
    options?.userAgent ?? watchdogUserAgent("threat.honeydb.lookup");
  const res = await fetch(
    `https://honeydb.io/api/ip-context/${encodeURIComponent(ip)}`,
    {
      method: "GET",
      signal,
      headers: {
        Accept: "application/json",
        "X-HoneyDb-ApiId": id,
        "X-HoneyDb-ApiKey": key,
        "User-Agent": ua,
      },
    }
  );

  if (res.status === 404) {
    return honeydbLookupSnapshotSchema.parse({
      ip,
      queriedAt: new Date().toISOString(),
      source: "honeydb.io",
      found: false,
      asn: null,
      country: null,
      isTor: false,
      isThreat: false,
      internetScanner: false,
      historyEventCount: 0,
    });
  }
  if (res.status === 429) {
    throw rateLimitedToolsError("HoneyDB", ip);
  }
  if (!res.ok) {
    throw httpToolsError(
      "HoneyDB API",
      res.status,
      `HoneyDB API ${res.status} for ${ip}`
    );
  }

  const body: unknown = await res.json();
  if (!isRecord(body)) {
    throw parseToolsError("HoneyDB", ip);
  }
  const networkInfo = isRecord(body.network_info) ? body.network_info : {};
  const threatInfo = isRecord(body.threat_info) ? body.threat_info : {};

  const isTor = threatInfo.is_tor === true;
  const isThreat = threatInfo.is_threat === true;
  const internetScanner = body.internet_scanner === true;
  const historyEventCount = sumHistoryEvents(body.ip_history);

  return honeydbLookupSnapshotSchema.parse({
    ip,
    queriedAt: new Date().toISOString(),
    source: "honeydb.io",
    found: isThreat || internetScanner || historyEventCount > 0,
    asn: typeof networkInfo.asn === "number" ? networkInfo.asn : null,
    country: asString(networkInfo.country),
    isTor,
    isThreat,
    internetScanner,
    historyEventCount,
  });
}
