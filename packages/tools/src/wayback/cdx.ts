import { httpToolsError } from "../errors/tools-error";
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

interface WaybackLookupOptions {
  userAgent: string;
  limit?: number;
  filterStatus200?: boolean;
}

const CDX_OPTIONAL_FIELDS = [
  [2, "statuscode"],
  [3, "mimetype"],
  [4, "digest"],
] as const;

function cdxRowFromArray(row: unknown, url: string): WaybackCdxRow | null {
  if (!isUnknownArray(row) || !row[0]) return null;
  const parsed: WaybackCdxRow = {
    timestamp: cdxField(row[0]) ?? "",
    original: cdxField(row[1]) ?? url,
  };
  for (const [index, key] of CDX_OPTIONAL_FIELDS) {
    if (row[index] === undefined) continue;
    parsed[key] = cdxField(row[index]) ?? "";
  }
  return parsed;
}

function parseCdxRows(payload: unknown[], url: string): WaybackCdxRow[] {
  const hasHeader =
    isUnknownArray(payload[0]) && String(payload[0][0]) === "timestamp";
  const dataRows = hasHeader ? payload.slice(1) : payload;
  const rows: WaybackCdxRow[] = [];
  for (const row of dataRows) {
    const parsed = cdxRowFromArray(row, url);
    if (parsed) rows.push(parsed);
  }
  return rows;
}

/**
 * CDX history rows for a URL — shared by archive.wayback.lookup and url.enrich.
 */
export async function fetchWaybackLookup(
  url: string,
  signal: AbortSignal,
  options: WaybackLookupOptions
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
    throw httpToolsError(
      "Wayback CDX",
      res.status,
      `Wayback CDX HTTP ${res.status} for ${url}`
    );
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

  const rows = parseCdxRows(payload, url);

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

interface CdxOptions {
  userAgent: string;
  maxBytes?: number;
}
export async function fetchWaybackSnapshot(
  url: string,
  timestamp: string,
  signal: AbortSignal,
  options: CdxOptions
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
