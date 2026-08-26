import { z } from "zod";

import {
  httpToolsError,
  parseToolsError,
  rateLimitedToolsError,
} from "../errors/tools-error";
import { asString, isRecord } from "../parse/coerce";
import { normalizeHost } from "../whois/normalize";

export const urlscanHitSchema = z.object({
  uuid: z.string(),
  url: z.string(),
  domain: z.string().nullable(),
  ip: z.string().nullable(),
  country: z.string().nullable(),
  server: z.string().nullable(),
  asn: z.string().nullable(),
  asnName: z.string().nullable(),
  ptr: z.string().nullable(),
  scannedAt: z.string().nullable(),
  resultUrl: z.string().nullable(),
});

export const urlscanLookupSnapshotSchema = z.object({
  host: z.string().min(1),
  queriedAt: z.string().min(1),
  source: z.literal("urlscan.io/api/v1/search"),
  total: z.number().int().nullable(),
  urls: z.array(z.string()),
  domains: z.array(z.string()),
  hits: z.array(urlscanHitSchema),
});

export type UrlscanHit = z.infer<typeof urlscanHitSchema>;
export type UrlscanLookupSnapshot = z.infer<typeof urlscanLookupSnapshotSchema>;

/**
 * URLScan.io search API — past public scans for a domain (not a live submit).
 * GET https://urlscan.io/api/v1/search/?q=page.domain:{host}&size=
 * @see https://urlscan.io/docs/api/
 */
export async function fetchUrlscanSearch(
  hostRaw: string,
  signal: AbortSignal,
  options?: { userAgent?: string; size?: number }
): Promise<UrlscanLookupSnapshot> {
  const host = normalizeHost(hostRaw);
  const size = Math.min(Math.max(options?.size ?? 20, 1), 100);
  const ua =
    options?.userAgent ?? "Watchdog/1.0 (+network.urlscan.lookup; OSINT)";

  const url = new URL("https://urlscan.io/api/v1/search/");
  url.searchParams.set("q", `page.domain:${host}`);
  url.searchParams.set("size", String(size));

  const res = await fetch(url, {
    method: "GET",
    signal,
    headers: { Accept: "application/json", "User-Agent": ua },
  });

  if (res.status === 429) {
    throw rateLimitedToolsError("URLScan", host);
  }
  if (!res.ok) {
    throw httpToolsError(
      "URLScan API",
      res.status,
      `URLScan API ${res.status} for ${host}`
    );
  }

  const body: unknown = await res.json();
  if (!isRecord(body)) {
    throw parseToolsError("URLScan", host);
  }
  const rows = Array.isArray(body.results) ? body.results : [];
  const hits: UrlscanHit[] = [];
  const urls: string[] = [];
  const domains: string[] = [];
  const seenUrl = new Set<string>();
  const seenDomain = new Set<string>();

  for (const row of rows) {
    if (!isRecord(row)) continue;
    const task = isRecord(row.task) ? row.task : {};
    const page = isRecord(row.page) ? row.page : {};

    const pageUrl = asString(page.url) ?? asString(task.url);
    const uuid = asString(task.uuid) ?? asString(row._id) ?? "";
    if (!pageUrl || !uuid) continue;

    let domain: string | null = asString(page.domain) ?? asString(task.domain);
    if (domain) {
      try {
        domain = normalizeHost(domain);
      } catch {
        domain = null;
      }
    }

    const hit: UrlscanHit = {
      uuid,
      url: pageUrl,
      domain,
      ip: asString(page.ip),
      country: asString(page.country),
      server: asString(page.server),
      asn: asString(page.asn),
      asnName: asString(page.asnname),
      ptr: asString(page.ptr),
      scannedAt: asString(task.time),
      resultUrl: asString(row.result),
    };
    hits.push(hit);

    if (!seenUrl.has(pageUrl)) {
      seenUrl.add(pageUrl);
      urls.push(pageUrl);
    }
    if (domain && !seenDomain.has(domain)) {
      seenDomain.add(domain);
      domains.push(domain);
    }
  }

  return urlscanLookupSnapshotSchema.parse({
    host,
    queriedAt: new Date().toISOString(),
    source: "urlscan.io/api/v1/search",
    total: typeof body.total === "number" ? body.total : null,
    urls,
    domains,
    hits,
  });
}
