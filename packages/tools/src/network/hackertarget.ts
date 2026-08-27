import { z } from "zod";

import { normalizeIp } from "../dns/reverse";
import { httpToolsError, rateLimitedToolsError } from "../errors/tools-error";
import { watchdogUserAgent } from "../errors/user-agent";
import { normalizeHost } from "../whois/normalize";

export const hackertargetLookupSnapshotSchema = z.object({
  ip: z.string().min(1),
  queriedAt: z.string().min(1),
  source: z.literal("api.hackertarget.com/reverseiplookup"),
  domains: z.array(z.string()),
  error: z.string().nullable(),
});

export type HackertargetLookupSnapshot = z.infer<
  typeof hackertargetLookupSnapshotSchema
>;

/**
 * HackerTarget reverse-IP (co-hosted hostnames).
 * GET https://api.hackertarget.com/reverseiplookup/?q={ip}
 * @see https://hackertarget.com/reverse-ip-lookup/
 */

interface HackertargetOptions {
  userAgent?: string;
  limit?: number;
}

function hackertargetResponseError(text: string): string | null {
  if (
    text === "" ||
    /no records/i.test(text) ||
    /error check your search parameter/i.test(text) ||
    /error invalid ip/i.test(text)
  ) {
    return text === "" || /no records/i.test(text)
      ? null
      : "invalid or empty reverse-IP response";
  }
  if (/^error\b/i.test(text) || /api count exceeded/i.test(text)) {
    return text.split("\n")[0]?.trim() ?? "HackerTarget error";
  }
  return null;
}

function parseHackertargetDomains(
  text: string,
  limit: number,
  seen: Set<string>
): string[] {
  const domains: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const raw = line.trim();
    if (!raw || raw.includes(" ")) continue;
    try {
      const host = normalizeHost(raw);
      if (seen.has(host)) continue;
      seen.add(host);
      domains.push(host);
      if (domains.length >= limit) break;
    } catch {
      /* skip */
    }
  }
  return domains;
}

export async function fetchHackertargetReverseIp(
  ipRaw: string,
  signal: AbortSignal,
  options?: HackertargetOptions
): Promise<HackertargetLookupSnapshot> {
  const ip = normalizeIp(ipRaw);
  const limit = options?.limit ?? 200;
  const ua =
    options?.userAgent ?? watchdogUserAgent("network.hackertarget.lookup");

  const url = new URL("https://api.hackertarget.com/reverseiplookup/");
  url.searchParams.set("q", ip);

  const res = await fetch(url, {
    method: "GET",
    signal,
    headers: { Accept: "text/plain", "User-Agent": ua },
  });

  if (res.status === 429) {
    throw rateLimitedToolsError("HackerTarget", ip);
  }
  if (!res.ok) {
    throw httpToolsError(
      "HackerTarget API",
      res.status,
      `HackerTarget API ${res.status} for ${ip}`
    );
  }

  const text = (await res.text()).trim();
  const seen = new Set<string>();
  const responseError = hackertargetResponseError(text);
  const domains =
    responseError === null && text !== ""
      ? parseHackertargetDomains(text, limit, seen)
      : [];
  const error = responseError;

  return hackertargetLookupSnapshotSchema.parse({
    ip,
    queriedAt: new Date().toISOString(),
    source: "api.hackertarget.com/reverseiplookup",
    domains,
    error,
  });
}
