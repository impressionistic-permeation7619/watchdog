import { z } from "zod";

import { normalizeIp } from "../dns/reverse";
import {
  httpToolsError,
  rateLimitedToolsError,
} from "../errors/tools-error";
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
export async function fetchHackertargetReverseIp(
  ipRaw: string,
  signal: AbortSignal,
  options?: { userAgent?: string; limit?: number }
): Promise<HackertargetLookupSnapshot> {
  const ip = normalizeIp(ipRaw);
  const limit = options?.limit ?? 200;
  const ua =
    options?.userAgent ?? "Watchdog/1.0 (+network.hackertarget.lookup; OSINT)";

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

  const rawText = await res.text();
  const text = rawText.trim();
  let error: string | null = null;
  const domains: string[] = [];
  const seen = new Set<string>();

  if (
    text === "" ||
    /no records/i.test(text) ||
    /error check your search parameter/i.test(text) ||
    /error invalid ip/i.test(text)
  ) {
    error =
      text === "" || /no records/i.test(text)
        ? null
        : "invalid or empty reverse-IP response";
  } else if (/^error\b/i.test(text) || /api count exceeded/i.test(text)) {
    error = text.split("\n")[0]?.trim() ?? "HackerTarget error";
  } else {
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
  }

  return hackertargetLookupSnapshotSchema.parse({
    ip,
    queriedAt: new Date().toISOString(),
    source: "api.hackertarget.com/reverseiplookup",
    domains,
    error,
  });
}
