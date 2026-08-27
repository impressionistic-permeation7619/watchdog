import { z } from "zod";

import { normalizeIp } from "../dns/reverse";
import {
  httpToolsError,
  missingApiKey,
  parseToolsError,
} from "../errors/tools-error";
import { isRecord } from "../parse/coerce";
import { watchdogUserAgent } from "../errors/user-agent";

export const abuseIpdbLookupSnapshotSchema = z.object({
  ip: z.string().min(1),
  queriedAt: z.string().min(1),
  found: z.boolean(),
  status: z.number().int().nullable(),
  abuseConfidenceScore: z.number().nullable(),
  totalReports: z.number().int().nullable(),
  numDistinctUsers: z.number().int().nullable(),
  lastReportedAt: z.string().nullable(),
  isPublic: z.boolean().nullable(),
  isWhitelisted: z.boolean().nullable(),
  isp: z.string().nullable(),
  domain: z.string().nullable(),
  usageType: z.string().nullable(),
  countryCode: z.string().nullable(),
});

export type AbuseIpdbLookupSnapshot = z.infer<
  typeof abuseIpdbLookupSnapshotSchema
>;

/**
 * AbuseIPDB APIv2 check —
 * GET https://api.abuseipdb.com/api/v2/check?ipAddress=
 * Auth: Key header.
 * @see https://docs.abuseipdb.com/
 */

type AbuseipdbOptions = { userAgent?: string; maxAgeInDays?: number };
export async function fetchAbuseIpdbCheck(
  ipRaw: string,
  apiKey: string,
  signal: AbortSignal,
  options?: AbuseipdbOptions
): Promise<AbuseIpdbLookupSnapshot> {
  const ip = normalizeIp(ipRaw);
  const key = apiKey.trim();
  if (!key) throw missingApiKey("ABUSEIPDB_API_KEY");

  const ua =
    options?.userAgent ?? watchdogUserAgent("threat.abuseipdb.lookup");
  const url = new URL("https://api.abuseipdb.com/api/v2/check");
  url.searchParams.set("ipAddress", ip);
  url.searchParams.set("maxAgeInDays", String(options?.maxAgeInDays ?? 90));

  const res = await fetch(url, {
    method: "GET",
    signal,
    headers: {
      Accept: "application/json",
      Key: key,
      "User-Agent": ua,
    },
  });

  if (!res.ok) {
    throw httpToolsError(
      "AbuseIPDB API",
      res.status,
      `AbuseIPDB API ${res.status} for ${ip}`
    );
  }

  const body: unknown = await res.json();
  if (!isRecord(body)) {
    throw parseToolsError("AbuseIPDB", ip);
  }
  const data = isRecord(body.data) ? body.data : {};

  return abuseIpdbLookupSnapshotSchema.parse({
    ip,
    queriedAt: new Date().toISOString(),
    found: true,
    status: res.status,
    abuseConfidenceScore:
      typeof data.abuseConfidenceScore === "number"
        ? data.abuseConfidenceScore
        : null,
    totalReports:
      typeof data.totalReports === "number" ? data.totalReports : null,
    numDistinctUsers:
      typeof data.numDistinctUsers === "number" ? data.numDistinctUsers : null,
    lastReportedAt:
      typeof data.lastReportedAt === "string" ? data.lastReportedAt : null,
    isPublic: typeof data.isPublic === "boolean" ? data.isPublic : null,
    isWhitelisted:
      typeof data.isWhitelisted === "boolean" ? data.isWhitelisted : null,
    isp: typeof data.isp === "string" ? data.isp : null,
    domain: typeof data.domain === "string" ? data.domain : null,
    usageType: typeof data.usageType === "string" ? data.usageType : null,
    countryCode: typeof data.countryCode === "string" ? data.countryCode : null,
  });
}
