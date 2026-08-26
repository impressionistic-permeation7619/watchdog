import { Resolver } from "node:dns/promises";
import { isIP } from "node:net";

import { z } from "zod";

import {
  abortedToolsError,
  validationToolsError,
} from "../errors/tools-error";

export const dnsReverseSnapshotSchema = z.object({
  ip: z.string().min(1),
  queriedAt: z.string().min(1),
  hostnames: z.array(z.string()),
});

export type DnsReverseSnapshot = z.infer<typeof dnsReverseSnapshotSchema>;

/** Normalize and validate an IPv4/IPv6 address string. */
export function normalizeIp(raw: string): string {
  const trimmed = raw.trim();
  if (!isIP(trimmed)) {
    throw validationToolsError(`Invalid IP address: ${raw}`);
  }
  return trimmed;
}

/** Reverse DNS (PTR) via system resolver — hostnames only, not ownership. */
export async function fetchDnsReverse(
  ip: string,
  signal: AbortSignal
): Promise<DnsReverseSnapshot> {
  const normalized = normalizeIp(ip);
  const resolver = new Resolver();
  const onAbort = () => {
    try {
      resolver.cancel();
    } catch {
      // already cancelled / idle
    }
  };
  if (signal.aborted) {
    onAbort();
    throw abortedToolsError("DNS reverse aborted");
  }
  signal.addEventListener("abort", onAbort, { once: true });
  try {
    const hostnames = await resolver
      .reverse(normalized)
      .catch(() => [] as string[]);
    if (signal.aborted) throw abortedToolsError("DNS reverse aborted");
    const cleaned = [
      ...new Set(
        hostnames
          .map((h) => h.replace(/\.$/, "").toLowerCase())
          .filter((h) => h.length > 0)
      ),
    ];
    return dnsReverseSnapshotSchema.parse({
      ip: normalized,
      queriedAt: new Date().toISOString(),
      hostnames: cleaned,
    });
  } finally {
    signal.removeEventListener("abort", onAbort);
  }
}
