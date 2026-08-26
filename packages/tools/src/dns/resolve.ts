import type { DnsRecords } from "./schema";
import {
  assertNotAborted,
  withAbortableResolver,
} from "./abortable-resolver";

export type { DnsRecords };

/** Resolve A/AAAA/MX/TXT/NS; cancels the Node resolver on abort. */
export async function resolveDnsRecords(
  host: string,
  signal: AbortSignal
): Promise<DnsRecords> {
  const { resolver, cleanup } = withAbortableResolver(
    signal,
    "DNS lookup aborted"
  );
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
    assertNotAborted(signal, "DNS lookup aborted");
    return { host, a, aaaa, mx, txt, ns };
  } finally {
    cleanup();
  }
}
