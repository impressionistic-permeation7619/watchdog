import { z } from "zod";

import { normalizeIp } from "../dns/reverse";
import {
  httpToolsError,
  missingApiKey,
  parseToolsError,
} from "../errors/tools-error";
import { isRecord } from "../parse/coerce";
import { watchdogUserAgent } from "../errors/user-agent";

export const shodanLookupSnapshotSchema = z.object({
  ip: z.string().min(1),
  queriedAt: z.string().min(1),
  found: z.boolean(),
  status: z.number().int().nullable(),
  org: z.string().nullable(),
  isp: z.string().nullable(),
  asn: z.string().nullable(),
  hostnames: z.array(z.string()),
  ports: z.array(z.number().int()),
  tags: z.array(z.string()),
  os: z.string().nullable(),
  countryCode: z.string().nullable(),
  city: z.string().nullable(),
  lastUpdate: z.string().nullable(),
});

export type ShodanLookupSnapshot = z.infer<typeof shodanLookupSnapshotSchema>;

/**
 * Shodan host lookup — GET /shodan/host/{ip}?key=&minify=true
 * @see https://developer.shodan.io/api
 */
export async function fetchShodanHost(
  ipRaw: string,
  apiKey: string,
  signal: AbortSignal,
  options?: { userAgent?: string }
): Promise<ShodanLookupSnapshot> {
  const ip = normalizeIp(ipRaw);
  const key = apiKey.trim();
  if (!key) throw missingApiKey("SHODAN_API_KEY");

  const ua =
    options?.userAgent ?? watchdogUserAgent("network.shodan.lookup");
  const url = new URL(
    `https://api.shodan.io/shodan/host/${encodeURIComponent(ip)}`
  );
  url.searchParams.set("key", key);
  url.searchParams.set("minify", "true");

  const res = await fetch(url, {
    method: "GET",
    signal,
    headers: { Accept: "application/json", "User-Agent": ua },
  });

  if (res.status === 404) {
    return shodanLookupSnapshotSchema.parse({
      ip,
      queriedAt: new Date().toISOString(),
      found: false,
      status: 404,
      org: null,
      isp: null,
      asn: null,
      hostnames: [],
      ports: [],
      tags: [],
      os: null,
      countryCode: null,
      city: null,
      lastUpdate: null,
    });
  }

  if (!res.ok) {
    throw httpToolsError(
      "Shodan API",
      res.status,
      `Shodan API ${res.status} for ${ip}`
    );
  }

  const body: unknown = await res.json();
  if (!isRecord(body)) {
    throw parseToolsError("Shodan", ip);
  }
  const hostnames = Array.isArray(body.hostnames)
    ? body.hostnames.filter((h): h is string => typeof h === "string")
    : [];
  const ports = Array.isArray(body.ports)
    ? body.ports.filter((p): p is number => typeof p === "number")
    : [];
  const tags = Array.isArray(body.tags)
    ? body.tags.filter((t): t is string => typeof t === "string")
    : [];

  return shodanLookupSnapshotSchema.parse({
    ip,
    queriedAt: new Date().toISOString(),
    found: true,
    status: res.status,
    org: typeof body.org === "string" ? body.org : null,
    isp: typeof body.isp === "string" ? body.isp : null,
    asn: typeof body.asn === "string" ? body.asn : null,
    hostnames,
    ports,
    tags,
    os: typeof body.os === "string" ? body.os : null,
    countryCode:
      typeof body.country_code === "string" ? body.country_code : null,
    city: typeof body.city === "string" ? body.city : null,
    lastUpdate: typeof body.last_update === "string" ? body.last_update : null,
  });
}
