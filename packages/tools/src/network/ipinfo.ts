import { z } from "zod";

import { normalizeIp } from "../dns/reverse";
import {
  httpToolsError,
  missingApiKey,
  parseToolsError,
  rateLimitedToolsError,
} from "../errors/tools-error";
import { asString, isRecord } from "../parse/coerce";

export const ipinfoLookupSnapshotSchema = z.object({
  ip: z.string().min(1),
  queriedAt: z.string().min(1),
  source: z.literal("ipinfo.io"),
  found: z.boolean(),
  hostname: z.string().nullable(),
  city: z.string().nullable(),
  region: z.string().nullable(),
  country: z.string().nullable(),
  loc: z.string().nullable(),
  org: z.string().nullable(),
  postal: z.string().nullable(),
  timezone: z.string().nullable(),
});

export type IpinfoLookupSnapshot = z.infer<typeof ipinfoLookupSnapshotSchema>;

/**
 * IPinfo.io GeoIP + org lookup (classic free-tier compatible endpoint).
 * GET https://ipinfo.io/{ip}/json?token=KEY
 * @see https://ipinfo.io/developers
 */
export async function fetchIpinfoLookup(
  ipRaw: string,
  apiToken: string,
  signal: AbortSignal,
  options?: { userAgent?: string }
): Promise<IpinfoLookupSnapshot> {
  const token = apiToken.trim();
  if (!token) throw missingApiKey("IPINFO_API_TOKEN");
  const ip = normalizeIp(ipRaw);
  const ua =
    options?.userAgent ?? "Watchdog/1.0 (+network.ipinfo.lookup; OSINT)";

  const url = new URL(`https://ipinfo.io/${ip}/json`);
  url.searchParams.set("token", token);

  const res = await fetch(url, {
    method: "GET",
    signal,
    headers: { Accept: "application/json", "User-Agent": ua },
  });

  if (res.status === 429) {
    throw rateLimitedToolsError("IPinfo", ip);
  }
  if (!res.ok) {
    throw httpToolsError(
      "IPinfo API",
      res.status,
      `IPinfo API ${res.status} for ${ip}`
    );
  }

  const body: unknown = await res.json();
  if (!isRecord(body)) {
    throw parseToolsError("IPinfo", ip);
  }

  return ipinfoLookupSnapshotSchema.parse({
    ip,
    queriedAt: new Date().toISOString(),
    source: "ipinfo.io",
    found: typeof body.bogon !== "boolean",
    hostname: asString(body.hostname),
    city: asString(body.city),
    region: asString(body.region),
    country: asString(body.country),
    loc: asString(body.loc),
    org: asString(body.org),
    postal: asString(body.postal),
    timezone: asString(body.timezone),
  });
}
