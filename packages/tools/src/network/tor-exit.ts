import { z } from "zod";

import { createTtlCache } from "../cache/ttl-memory";
import { normalizeIp } from "../dns/reverse";
import { httpToolsError } from "../errors/tools-error";

export const torExitLookupSnapshotSchema = z.object({
  ip: z.string().min(1),
  queriedAt: z.string().min(1),
  source: z.literal("check.torproject.org"),
  isExit: z.boolean(),
});

export type TorExitLookupSnapshot = z.infer<typeof torExitLookupSnapshotSchema>;

const EXIT_LIST_TTL_MS = 60 * 60_000;
const EXIT_LIST_CACHE_KEY = "exit-addresses";
const exitListCache = createTtlCache<Set<string>>(EXIT_LIST_TTL_MS);

/** Exported for unit tests — same parser used by fetchTorExitLookup. */
export function parseExitAddresses(text: string): Set<string> {
  const ips = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const match = /^ExitAddress\s+(\S+)/.exec(line.trim());
    const candidate = match?.[1];
    if (!candidate) continue;
    try {
      ips.add(normalizeIp(candidate));
    } catch {
      /* skip malformed entries */
    }
  }
  return ips;
}

async function fetchExitAddresses(
  signal: AbortSignal,
  ua: string
): Promise<Set<string>> {
  const cached = exitListCache.get(EXIT_LIST_CACHE_KEY);
  if (cached) return cached;

  const res = await fetch("https://check.torproject.org/exit-addresses", {
    method: "GET",
    signal,
    headers: { Accept: "text/plain", "User-Agent": ua },
  });
  if (!res.ok) {
    throw httpToolsError(
      "Tor exit-address list",
      res.status,
      `Tor exit-address list ${res.status}`
    );
  }

  const ips = parseExitAddresses(await res.text());
  exitListCache.set(EXIT_LIST_CACHE_KEY, ips);
  return ips;
}

/**
 * Tor exit-node membership check against the official exit-address list.
 * GET https://check.torproject.org/exit-addresses (1h in-process cache — public list, not per-IP).
 * @see https://check.torproject.org/exit-addresses
 */
export async function fetchTorExitLookup(
  ipRaw: string,
  signal: AbortSignal,
  options?: { userAgent?: string }
): Promise<TorExitLookupSnapshot> {
  const ip = normalizeIp(ipRaw);
  const ua =
    options?.userAgent ?? "Watchdog/1.0 (+network.tor_exit.lookup; OSINT)";

  const exits = await fetchExitAddresses(signal, ua);

  return torExitLookupSnapshotSchema.parse({
    ip,
    queriedAt: new Date().toISOString(),
    source: "check.torproject.org",
    isExit: exits.has(ip),
  });
}
