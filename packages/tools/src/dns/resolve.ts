import { Resolver } from "node:dns/promises";

import type { DnsRecords } from "./schema";

export type { DnsRecords };

/** Resolve A/AAAA/MX/TXT/NS; cancels the Node resolver on abort. */
export async function resolveDnsRecords(
  host: string,
  signal: AbortSignal
): Promise<DnsRecords> {
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
    throw new Error("DNS lookup aborted");
  }
  signal.addEventListener("abort", onAbort, { once: true });
  try {
    const [a, aaaa, mx, txt, ns] = await Promise.all([
      resolver.resolve4(host).catch(() => [] as string[]),
      resolver.resolve6(host).catch(() => [] as string[]),
      resolver
        .resolveMx(host)
        .catch(() => [] as { exchange: string; priority: number }[]),
      resolver.resolveTxt(host).catch(() => [] as string[][]),
      resolver.resolveNs(host).catch(() => [] as string[]),
    ]);
    if (signal.aborted) throw new Error("DNS lookup aborted");
    return { host, a, aaaa, mx, txt, ns };
  } finally {
    signal.removeEventListener("abort", onAbort);
  }
}
