import { z } from "zod";

import { httpToolsError, missingApiKey } from "../errors/tools-error";
import { asBool, isRecord } from "../parse/coerce";
import { normalizeHost } from "../whois/normalize";

export const c99SubdomainHitSchema = z.object({
  subdomain: z.string(),
  ip: z.string().nullable(),
  cloudflare: z.boolean().nullable(),
});

export const c99LookupSnapshotSchema = z.object({
  host: z.string().min(1),
  queriedAt: z.string().min(1),
  source: z.literal("api.c99.nl/subdomainfinder"),
  realtime: z.boolean(),
  domains: z.array(z.string()),
  hits: z.array(c99SubdomainHitSchema),
  error: z.string().nullable(),
});

export type C99SubdomainHit = z.infer<typeof c99SubdomainHitSchema>;
export type C99LookupSnapshot = z.infer<typeof c99LookupSnapshotSchema>;

function parseHit(row: unknown): C99SubdomainHit | null {
  if (!isRecord(row)) return null;
  let subdomainRaw: string;
  if (typeof row.subdomain === "string") {
    subdomainRaw = row.subdomain;
  } else if (typeof row.domain === "string") {
    subdomainRaw = row.domain;
  } else {
    subdomainRaw = "";
  }
  if (!subdomainRaw.trim()) return null;
  let subdomain: string;
  try {
    subdomain = normalizeHost(subdomainRaw.replace(/^\*\./, ""));
  } catch {
    return null;
  }
  let ip: string | null;
  if (typeof row.ip === "string" && row.ip.trim() !== "") {
    ip = row.ip.trim();
  } else if (
    typeof row.ip_address === "string" &&
    row.ip_address.trim() !== ""
  ) {
    ip = row.ip_address.trim();
  } else {
    ip = null;
  }
  return {
    subdomain,
    ip,
    cloudflare: asBool(row.cloudflare),
  };
}

/**
 * C99 subdomain finder —
 * GET https://api.c99.nl/subdomainfinder?key=&domain=&json
 * Optional realtime=true for instant scan.
 * @see https://api.c99.nl/api_overview
 */
export async function fetchC99Subdomains(
  hostRaw: string,
  apiKey: string,
  signal: AbortSignal,
  options?: { userAgent?: string; realtime?: boolean; limit?: number }
): Promise<C99LookupSnapshot> {
  const host = normalizeHost(hostRaw);
  const key = apiKey.trim();
  if (!key) throw missingApiKey("C99_API_KEY");

  const realtime = options?.realtime === true;
  const limit = options?.limit ?? 200;
  const ua = options?.userAgent ?? "Watchdog/1.0 (+network.c99.lookup; OSINT)";

  const url = new URL("https://api.c99.nl/subdomainfinder");
  url.searchParams.set("key", key);
  url.searchParams.set("domain", host);
  if (realtime) url.searchParams.set("realtime", "true");
  // C99 expects a bare `&json` flag (value optional).
  const fetchUrl = `${url.toString()}&json`;

  const res = await fetch(fetchUrl, {
    method: "GET",
    signal,
    headers: { Accept: "application/json", "User-Agent": ua },
  });

  if (!res.ok) {
    throw httpToolsError(
      "C99 API",
      res.status,
      `C99 API ${res.status} for ${host}`
    );
  }

  const body: unknown = await res.json();
  let error: string | null = null;
  let rows: unknown[] = [];

  if (Array.isArray(body)) {
    rows = body;
  } else if (isRecord(body)) {
    if (typeof body.error === "string" && body.error.trim() !== "") {
      error = body.error.trim();
    } else if (body.success === false && typeof body.error === "string") {
      error = body.error;
    }
    if (Array.isArray(body.subdomains)) rows = body.subdomains;
    else if (Array.isArray(body.data)) rows = body.data;
  }

  const hits: C99SubdomainHit[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const hit = parseHit(row);
    if (!hit || seen.has(hit.subdomain)) continue;
    seen.add(hit.subdomain);
    hits.push(hit);
    if (hits.length >= limit) break;
  }

  return c99LookupSnapshotSchema.parse({
    host,
    queriedAt: new Date().toISOString(),
    source: "api.c99.nl/subdomainfinder",
    realtime,
    domains: hits.map((h) => h.subdomain),
    hits,
    error,
  });
}
