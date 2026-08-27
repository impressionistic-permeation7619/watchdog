import { z } from "zod";

import { isRecord } from "../parse/coerce";
import {
  httpToolsError,
  validationToolsError,
} from "../errors/tools-error";
import { normalizeHost } from "../whois/normalize";
import { watchdogUserAgent } from "../errors/user-agent";

export const commoncrawlHitSchema = z.object({
  url: z.string(),
  timestamp: z.string().nullable(),
  status: z.string().nullable(),
  mime: z.string().nullable(),
  indexId: z.string(),
});

export const commoncrawlLookupSnapshotSchema = z.object({
  host: z.string().min(1),
  queriedAt: z.string().min(1),
  source: z.literal("index.commoncrawl.org"),
  indexes: z.array(z.string()),
  urls: z.array(z.string()),
  hits: z.array(commoncrawlHitSchema),
});

export type CommoncrawlHit = z.infer<typeof commoncrawlHitSchema>;
export type CommoncrawlLookupSnapshot = z.infer<
  typeof commoncrawlLookupSnapshotSchema
>;

/** CDX JSON may be NDJSON objects, a JSON array of objects, or array-rows. */
export function parseCommoncrawlCdxText(
  text: string
): Record<string, unknown>[] {
  const trimmed = text.trim();
  if (trimmed === "") return [];
  if (trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) return [];
      return parsed.flatMap((row) => {
        if (isRecord(row)) return [row];
        if (Array.isArray(row) && typeof row[2] === "string") {
          return [
            {
              url: row[2],
              timestamp: typeof row[1] === "string" ? row[1] : null,
              mime: typeof row[3] === "string" ? row[3] : null,
              status: typeof row[4] === "string" ? row[4] : null,
            },
          ];
        }
        return [];
      });
    } catch {
      return [];
    }
  }
  const out: Record<string, unknown>[] = [];
  for (const line of trimmed.split(/\r?\n/)) {
    const lineTrim = line.trim();
    if (!lineTrim) continue;
    try {
      const row: unknown = JSON.parse(lineTrim);
      if (isRecord(row)) out.push(row);
    } catch {
      /* ignore */
    }
  }
  return out;
}

type CommoncrawlLookupOptions = {
  userAgent?: string;
  /** How many newest indexes to query (default 2). */
  indexes?: number;
  /** Max hits to keep across indexes (default 40). */
  limit?: number;
};

/**
 * Common Crawl CDX — recent crawl indexes for URLs under a host.
 * Resolves latest indexes via collinfo.json, then queries each CDX API.
 * @see https://index.commoncrawl.org/
 */
export async function fetchCommoncrawlLookup(
  hostRaw: string,
  signal: AbortSignal,
  options?: CommoncrawlLookupOptions
): Promise<CommoncrawlLookupSnapshot> {
  const resolved = options ?? {};
  const host = normalizeHost(hostRaw);
  const indexCount = Math.min(Math.max(resolved.indexes ?? 2, 1), 6);
  const limit = Math.min(Math.max(resolved.limit ?? 40, 1), 200);
  const ua =
    resolved.userAgent ?? watchdogUserAgent("archive.commoncrawl.lookup");

  const collRes = await fetch("https://index.commoncrawl.org/collinfo.json", {
    method: "GET",
    signal,
    headers: { Accept: "application/json", "User-Agent": ua },
  });
  if (!collRes.ok) {
    throw httpToolsError(
      "Common Crawl collinfo",
      collRes.status,
      `Common Crawl collinfo ${collRes.status}`
    );
  }

  const coll: unknown = await collRes.json();
  if (!Array.isArray(coll) || coll.length === 0) {
    throw validationToolsError("Common Crawl collinfo empty");
  }

  const indexes: { id: string; cdxApi: string }[] = [];
  for (const row of coll) {
    if (!isRecord(row)) continue;
    const id = typeof row.id === "string" ? row.id : "";
    const cdxApi = typeof row["cdx-api"] === "string" ? row["cdx-api"] : "";
    if (!id || !cdxApi) continue;
    indexes.push({ id, cdxApi });
    if (indexes.length >= indexCount) break;
  }

  if (indexes.length === 0) {
    throw validationToolsError("Common Crawl: no usable indexes");
  }

  const hits: CommoncrawlHit[] = [];
  const urls: string[] = [];
  const seenUrl = new Set<string>();

  for (const index of indexes) {
    if (hits.length >= limit) break;
    const url = new URL(index.cdxApi);
    url.searchParams.set("url", `*.${host}/*`);
    url.searchParams.set("output", "json");
    url.searchParams.set("limit", String(Math.min(limit - hits.length, 50)));

    // oxlint-disable-next-line no-await-in-loop -- per-index limit depends on hits already collected, must stay sequential
    const res = await fetch(url, {
      method: "GET",
      signal,
      headers: { Accept: "application/json", "User-Agent": ua },
    });

    if (res.status === 404) continue;
    if (!res.ok) {
      throw httpToolsError(
        "Common Crawl CDX",
        res.status,
        `Common Crawl CDX ${res.status} (${index.id})`
      );
    }

    // oxlint-disable-next-line no-await-in-loop -- same ordered fan-out as above
    const text = await res.text();
    const cdxRows = parseCommoncrawlCdxText(text);
    for (const row of cdxRows) {
      const pageUrl = typeof row.url === "string" ? row.url : "";
      if (!pageUrl) continue;
      hits.push({
        url: pageUrl,
        timestamp: typeof row.timestamp === "string" ? row.timestamp : null,
        status: typeof row.status === "string" ? row.status : null,
        mime: typeof row.mime === "string" ? row.mime : null,
        indexId: index.id,
      });
      if (!seenUrl.has(pageUrl)) {
        seenUrl.add(pageUrl);
        urls.push(pageUrl);
      }
      if (hits.length >= limit) break;
    }
  }

  return commoncrawlLookupSnapshotSchema.parse({
    host,
    queriedAt: new Date().toISOString(),
    source: "index.commoncrawl.org",
    indexes: indexes.map((i) => i.id),
    urls,
    hits,
  });
}
