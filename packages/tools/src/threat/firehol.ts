import { isIPv4, isIPv6 } from "node:net";

import { z } from "zod";

import { createTtlCache } from "../cache/ttl-memory";
import { httpToolsError } from "../errors/tools-error";
import { normalizeIp } from "../dns/reverse";

export const fireholLookupSnapshotSchema = z.object({
  ip: z.string().min(1),
  queriedAt: z.string().min(1),
  source: z.literal("iplists.firehol.org"),
  list: z.literal("firehol_level1"),
  found: z.boolean(),
});

export type FireholLookupSnapshot = z.infer<typeof fireholLookupSnapshotSchema>;

interface CidrEntry {
  network: number;
  prefix: number;
}

interface FireholList {
  v4: CidrEntry[];
  v6: Set<string>;
}

const LIST_TTL_MS = 24 * 60 * 60_000;
const LIST_CACHE_KEY = "firehol_level1";
const listCache = createTtlCache<FireholList>(LIST_TTL_MS);

/** Dotted-quad → unsigned 32-bit integer, arithmetic only (no bitwise ops). */
function ipv4ToInt(ip: string): number {
  const parts = ip.split(".").map((p) => Math.trunc(Number(p)));
  return (
    (parts[0] ?? 0) * 16_777_216 +
    (parts[1] ?? 0) * 65_536 +
    (parts[2] ?? 0) * 256 +
    (parts[3] ?? 0)
  );
}

/** Zero out the host bits below `prefix`, arithmetic only (no bitwise ops). */
function networkAddress(ipInt: number, prefix: number): number {
  if (prefix >= 32) return ipInt;
  const blockSize = 2 ** (32 - prefix);
  return Math.floor(ipInt / blockSize) * blockSize;
}

/** Exported for unit tests — same parser used by fetchFireholLookup. */
export function parseCidrLine(line: string): CidrEntry | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;

  const slash = trimmed.indexOf("/");
  const addr = slash === -1 ? trimmed : trimmed.slice(0, slash);
  const prefix =
    slash === -1 ? 32 : Math.trunc(Number(trimmed.slice(slash + 1)));
  if (!isIPv4(addr) || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
    return null;
  }

  return { network: networkAddress(ipv4ToInt(addr), prefix), prefix };
}

/** Exact IPv6 (or /128) — FireHOL netsets can include v6; we skip v6 CIDR ranges. */
export function parseIpv6ExactLine(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return null;
  const slash = trimmed.indexOf("/");
  const addr = slash === -1 ? trimmed : trimmed.slice(0, slash);
  const prefix =
    slash === -1 ? 128 : Math.trunc(Number(trimmed.slice(slash + 1)));
  if (!isIPv6(addr) || prefix !== 128) return null;
  try {
    return normalizeIp(addr);
  } catch {
    return null;
  }
}

function ipInCidrList(ipInt: number, entries: CidrEntry[]): boolean {
  return entries.some(
    (entry) => networkAddress(ipInt, entry.prefix) === entry.network
  );
}

async function fetchCidrList(
  signal: AbortSignal,
  ua: string
): Promise<FireholList> {
  const cached = listCache.get(LIST_CACHE_KEY);
  if (cached) return cached;

  const res = await fetch(
    "https://iplists.firehol.org/files/firehol_level1.netset",
    {
      method: "GET",
      signal,
      headers: { Accept: "text/plain", "User-Agent": ua },
    }
  );
  if (!res.ok) {
    throw httpToolsError("FireHOL level1 list", res.status);
  }

  const text = await res.text();
  const v4: CidrEntry[] = [];
  const v6 = new Set<string>();
  for (const line of text.split(/\r?\n/)) {
    const cidr = parseCidrLine(line);
    if (cidr) v4.push(cidr);
    const ipv6 = parseIpv6ExactLine(line);
    if (ipv6) v6.add(ipv6);
  }

  const parsed = { v4, v6 };
  listCache.set(LIST_CACHE_KEY, parsed);
  return parsed;
}

/**
 * FireHOL level1 netset membership. IPv4 CIDR plus exact IPv6 (/128) rows
 * (skip IPv6 CIDR ranges).
 * GET https://iplists.firehol.org/files/firehol_level1.netset
 * @see http://iplists.firehol.org/?ipset=firehol_level1
 */
export async function fetchFireholLookup(
  ipRaw: string,
  signal: AbortSignal,
  options?: { userAgent?: string }
): Promise<FireholLookupSnapshot> {
  const ip = normalizeIp(ipRaw);
  const ua =
    options?.userAgent ?? "Watchdog/1.0 (+threat.firehol.lookup; OSINT)";

  let found = false;
  const list = await fetchCidrList(signal, ua);
  if (isIPv4(ip)) {
    found = ipInCidrList(ipv4ToInt(ip), list.v4);
  } else if (isIPv6(ip)) {
    found = list.v6.has(ip);
  }

  return fireholLookupSnapshotSchema.parse({
    ip,
    queriedAt: new Date().toISOString(),
    source: "iplists.firehol.org",
    list: "firehol_level1",
    found,
  });
}
