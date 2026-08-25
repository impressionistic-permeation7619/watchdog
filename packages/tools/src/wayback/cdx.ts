import { fetchBytes } from "../http/fetch-bytes";
import {
  waybackFetchSnapshotSchema,
  waybackLookupSnapshotSchema,
  type WaybackCdxRow,
  type WaybackFetchSnapshot,
  type WaybackLookupSnapshot,
} from "./schema";

const CDX = "https://web.archive.org/cdx/search/cdx";

export {
  waybackFetchSnapshotSchema,
  waybackLookupSnapshotSchema,
  type WaybackCdxRow,
  type WaybackFetchSnapshot,
  type WaybackLookupSnapshot,
} from "./schema";

/** `Array.isArray` narrows to `any[]` in lib.es5.d.ts; this narrows to `unknown[]` instead. */
function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

/** Stringify a CDX cell only if it's already string/number/boolean — avoids `[object Object]`. */
function cdxField(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
}

export function waybackArchiveUrl(timestamp: string, url: string): string {
  return `https://web.archive.org/web/${timestamp}id_/${url}`;
}

/**
 * CDX history rows for a URL — shared by archive.wayback.lookup and url.enrich.
 */
export async function fetchWaybackLookup(
  url: string,
  signal: AbortSignal,
  options: {
    userAgent: string;
    limit?: number;
    filterStatus200?: boolean;
  }
): Promise<WaybackLookupSnapshot> {
  const limit = options.limit ?? 25;
  const params = new URLSearchParams({
    url,
    output: "json",
    fl: "timestamp,original,statuscode,mimetype,digest",
    limit: String(limit),
    fastLatest: "true",
  });
  if (options.filterStatus200 !== false) {
    params.set("filter", "statuscode:200");
  }

  const res = await fetch(`${CDX}?${params.toString()}`, {
    signal,
    headers: { "User-Agent": options.userAgent },
  });
  if (!res.ok) {
    throw new Error(`Wayback CDX HTTP ${res.status} for ${url}`);
  }
  const payload: unknown = await res.json();
  if (!isUnknownArray(payload) || payload.length === 0) {
    return waybackLookupSnapshotSchema.parse({
      url,
      queriedAt: new Date().toISOString(),
      source: "web.archive.org/cdx",
      rows: [],
      closestTimestamp: null,
    });
  }

  const hasHeader =
    isUnknownArray(payload[0]) && String(payload[0][0]) === "timestamp";
  const dataRows = hasHeader ? payload.slice(1) : payload;
  const rows: WaybackCdxRow[] = [];
  for (const row of dataRows) {
    if (!isUnknownArray(row) || !row[0]) continue;
    rows.push({
      timestamp: cdxField(row[0]) ?? "",
      original: cdxField(row[1]) ?? url,
      ...(row[2] === undefined ? {} : { statuscode: cdxField(row[2]) ?? "" }),
      ...(row[3] === undefined ? {} : { mimetype: cdxField(row[3]) ?? "" }),
      ...(row[4] === undefined ? {} : { digest: cdxField(row[4]) ?? "" }),
    });
  }

  return waybackLookupSnapshotSchema.parse({
    url,
    queriedAt: new Date().toISOString(),
    source: "web.archive.org/cdx",
    rows,
    closestTimestamp: rows[0]?.timestamp ?? null,
  });
}

/** Closest Wayback CDX timestamp for a URL (200 responses). UA from Cap policy. */
export async function closestWaybackTimestamp(
  url: string,
  signal: AbortSignal,
  userAgent: string
): Promise<string | null> {
  const snap = await fetchWaybackLookup(url, signal, {
    userAgent,
    limit: 1,
    filterStatus200: true,
  });
  return snap.closestTimestamp;
}

/** Fetch a Wayback raw snapshot body (id_ URL). */
export async function fetchWaybackSnapshot(
  url: string,
  timestamp: string,
  signal: AbortSignal,
  options: { userAgent: string; maxBytes?: number }
): Promise<WaybackFetchSnapshot> {
  const archiveUrl = waybackArchiveUrl(timestamp, url);
  const maxBytes = options.maxBytes ?? 512_000;
  const res = await fetchBytes(archiveUrl, signal, {
    userAgent: options.userAgent,
    maxBytes,
    accept: "text/html,text/plain,*/*",
  });
  const bodyPreview = new TextDecoder().decode(res.bytes).slice(0, 8000);
  return waybackFetchSnapshotSchema.parse({
    url,
    timestamp,
    archiveUrl,
    queriedAt: new Date().toISOString(),
    status: res.status,
    ok: res.ok,
    contentType: res.contentType,
    bodyPreview,
    byteLength: res.bytes.byteLength,
    ...(res.ok ? {} : { error: res.error ?? `HTTP ${res.status}` }),
  });
}
