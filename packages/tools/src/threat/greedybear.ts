import { z } from "zod";

import { createTtlCache } from "../cache/ttl-memory";
import { httpToolsError, ToolsError } from "../errors/tools-error";
import { classifyIpOrHost } from "../parse/classify-ip-or-host";
import { asString, isRecord } from "../parse/coerce";

export const greedybearLookupSnapshotSchema = z.object({
  query: z.string().min(1),
  kind: z.enum(["ip", "domain"]),
  queriedAt: z.string().min(1),
  source: z.literal("greedybear.honeynet.org"),
  found: z.boolean(),
  feed: z.literal("all/scanner/recent"),
});

export type GreedybearLookupSnapshot = z.infer<
  typeof greedybearLookupSnapshotSchema
>;

const FEED_URL =
  "https://greedybear.honeynet.org/api/feeds/all/scanner/recent.json";
const FEED_TTL_MS = 30 * 60_000;
const FEED_CACHE_KEY = "all-scanner-recent";
const feedCache = createTtlCache<Set<string>>(FEED_TTL_MS);

/** IOC values from the public scanner feed JSON. */
export function parseGreedybearIocValues(body: unknown): Set<string> {
  if (!isRecord(body)) {
    throw new ToolsError("GreedyBear feed response was not a JSON object", {
      code: "invalid_response",
    });
  }
  const rows = Array.isArray(body.iocs) ? body.iocs : [];
  const values = new Set<string>();
  for (const row of rows) {
    if (!isRecord(row)) continue;
    const value = asString(row.value);
    if (value) values.add(value.toLowerCase());
  }
  return values;
}

async function fetchScannerFeed(
  signal: AbortSignal,
  ua: string
): Promise<Set<string>> {
  const cached = feedCache.get(FEED_CACHE_KEY);
  if (cached) return cached;

  const res = await fetch(FEED_URL, {
    method: "GET",
    signal,
    headers: { Accept: "application/json", "User-Agent": ua },
  });
  if (!res.ok) throw httpToolsError("GreedyBear feed", res.status);

  // Response shape: { license, iocs: [{ value, feed_type, scanner, ... }] }
  const body: unknown = await res.json();
  const values = parseGreedybearIocValues(body);
  feedCache.set(FEED_CACHE_KEY, values);
  return values;
}

/**
 * GreedyBear (Honeynet Project) public scanner feed — membership check for
 * an IP/domain against the last 3 days of honeypot-observed scanners.
 * GET https://greedybear.honeynet.org/api/feeds/all/scanner/recent.json
 * (30-minute in-process cache — public feed, not per-query.)
 * @see https://greedybear-docs.readthedocs.io/en/latest/OpenAPI.html
 */
export async function fetchGreedybearLookup(
  queryRaw: string,
  signal: AbortSignal,
  options?: { userAgent?: string }
): Promise<GreedybearLookupSnapshot> {
  const { kind, value } = classifyIpOrHost(queryRaw);
  const ua =
    options?.userAgent ?? "Watchdog/1.0 (+threat.greedybear.lookup; OSINT)";

  const feed = await fetchScannerFeed(signal, ua);

  return greedybearLookupSnapshotSchema.parse({
    query: value,
    kind,
    queriedAt: new Date().toISOString(),
    source: "greedybear.honeynet.org",
    found: feed.has(value.toLowerCase()),
    feed: "all/scanner/recent",
  });
}
