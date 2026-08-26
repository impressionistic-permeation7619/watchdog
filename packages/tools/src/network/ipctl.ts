import { z } from "zod";

import { normalizeIp } from "../dns/reverse";
import {
  httpToolsError,
  parseToolsError,
} from "../errors/tools-error";
import {
  asBool,
  asNumber,
  asString,
  isRecord,
  recordRows,
} from "../parse/coerce";

export const ipctlLookupSnapshotSchema = z.object({
  ip: z.string().min(1),
  queriedAt: z.string().min(1),
  source: z.literal("api.ipctl.io"),
  asn: z.number().int().nullable(),
  asName: z.string().nullable(),
  bgpPrefix: z.string().nullable(),
  /** Prefix/RIR country — not MaxMind GeoIP. */
  rirCountryCode: z.string().nullable(),
  rir: z.string().nullable(),
  rpkiStatus: z.string().nullable(),
  reverseDns: z.string().nullable(),
  isAnycast: z.boolean().nullable(),
  isBogon: z.boolean().nullable(),
  /** MaxMind-style estimate — label as GeoIP, not RIR. */
  geoCountryCode: z.string().nullable(),
  geoCity: z.string().nullable(),
  geoRegion: z.string().nullable(),
  geoCountryName: z.string().nullable(),
  threatScore: z.number().nullable(),
  tags: z.array(z.string()),
});

export type IpctlLookupSnapshot = z.infer<typeof ipctlLookupSnapshotSchema>;

export function parseIpctlBody(
  ip: string,
  queriedAt: string,
  data: Record<string, unknown>
): IpctlLookupSnapshot {
  const prefix = isRecord(data.prefix) ? data.prefix : {};
  const asnObj = isRecord(data.asn) ? data.asn : {};
  const geo = isRecord(data.geo) ? data.geo : {};
  const tags = Array.isArray(data.tags)
    ? data.tags.flatMap((row) => {
        const value = asString(row);
        return value === null ? [] : [value];
      })
    : recordRows(data.tags).flatMap((row) => {
        const value = asString(row.name) ?? asString(row.tag);
        return value === null ? [] : [value];
      });

  return ipctlLookupSnapshotSchema.parse({
    ip,
    queriedAt,
    source: "api.ipctl.io",
    asn: asNumber(asnObj.asn) ?? asNumber(prefix.asn) ?? asNumber(data.asn),
    asName: asString(asnObj.name),
    bgpPrefix:
      asString(prefix.prefix) ??
      asString(data.bgp_prefix) ??
      (typeof data.prefix === "string" ? asString(data.prefix) : null),
    rirCountryCode:
      asString(prefix.country_code) ?? asString(asnObj.country_code),
    rir: asString(prefix.rir) ?? asString(asnObj.rir),
    rpkiStatus: asString(prefix.rpki_status) ?? asString(data.rpki_status),
    reverseDns: asString(data.reverse_dns),
    isAnycast: asBool(data.is_anycast),
    isBogon: asBool(data.is_bogon),
    geoCountryCode: asString(geo.country_code),
    geoCity: asString(geo.city),
    geoRegion: asString(geo.region_name) ?? asString(geo.region),
    geoCountryName: asString(geo.country_name),
    threatScore: asNumber(data.threat_score),
    tags,
  });
}

/**
 * ipctl.io IP→BGP lookup (BGPView shut down Nov 2025).
 * GET https://api.ipctl.io/v1/ip/{ip}
 * @see https://ipctl.io/vs/bgpview
 */
export async function fetchIpctlLookup(
  ipRaw: string,
  signal: AbortSignal,
  options?: { userAgent?: string }
): Promise<IpctlLookupSnapshot> {
  const ip = normalizeIp(ipRaw);
  const ua =
    options?.userAgent ?? "Watchdog/1.0 (+network.ipctl.lookup; OSINT)";

  const url = `https://api.ipctl.io/v1/ip/${encodeURIComponent(ip)}`;
  const res = await fetch(url, {
    method: "GET",
    signal,
    headers: { Accept: "application/json", "User-Agent": ua },
  });

  if (!res.ok) {
    throw httpToolsError(
      "ipctl API",
      res.status,
      `ipctl API ${res.status} for ${ip}`
    );
  }

  const body: unknown = await res.json();
  if (!isRecord(body)) {
    throw parseToolsError("ipctl", ip);
  }
  const data = isRecord(body.data) ? body.data : {};
  return parseIpctlBody(ip, new Date().toISOString(), data);
}
