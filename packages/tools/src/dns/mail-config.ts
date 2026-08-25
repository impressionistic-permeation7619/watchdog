import { Resolver } from "node:dns/promises";

import {
  mailConfigSnapshotSchema,
  type MailConfigSnapshot,
} from "./mail-config-schema";

export { mailConfigSnapshotSchema, type MailConfigSnapshot };

/** Common DKIM selectors — posture probe, not exhaustive enumeration. */
const DEFAULT_DKIM_SELECTORS = [
  "default",
  "google",
  "selector1",
  "selector2",
  "k1",
  "s1",
  "s2",
  "mail",
  "dkim",
] as const;

function flattenTxt(chunks: string[][]): string[] {
  return chunks.map((parts) => parts.join(""));
}

function withResolverAbort(signal: AbortSignal): {
  resolver: Resolver;
  cleanup: () => void;
} {
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
    throw new Error("Mail config lookup aborted");
  }
  signal.addEventListener("abort", onAbort, { once: true });
  return {
    resolver,
    cleanup: () => {
      signal.removeEventListener("abort", onAbort);
    },
  };
}

async function resolveTxtFlat(
  resolver: Resolver,
  name: string
): Promise<string[]> {
  const chunks = await resolver.resolveTxt(name).catch(() => [] as string[][]);
  return flattenTxt(chunks);
}

/**
 * Collect MX + SPF/DMARC/DKIM posture via DNS only (passive).
 * DKIM uses a small fixed selector list — not a full selector hunt.
 */
export async function fetchMailConfig(
  host: string,
  signal: AbortSignal,
  options?: { dkimSelectors?: readonly string[] }
): Promise<MailConfigSnapshot> {
  const { resolver, cleanup } = withResolverAbort(signal);
  try {
    const selectors = options?.dkimSelectors ?? DEFAULT_DKIM_SELECTORS;
    const [mx, txtRoot, txtDmarc, ...dkimResults] = await Promise.all([
      resolver
        .resolveMx(host)
        .catch(() => [] as { exchange: string; priority: number }[]),
      resolveTxtFlat(resolver, host),
      resolveTxtFlat(resolver, `_dmarc.${host}`),
      ...selectors.map(async (selector) => {
        const name = `${selector}._domainkey.${host}`;
        const records = await resolveTxtFlat(resolver, name);
        return {
          selector,
          present: records.some((r) => /v=DKIM1/i.test(r)),
          records,
        };
      }),
    ]);

    if (signal.aborted) throw new Error("Mail config lookup aborted");

    const spfRecords = txtRoot.filter((r) => /v=spf1/i.test(r));
    const dmarcRecords = txtDmarc.filter((r) => /v=DMARC1/i.test(r));
    const found = dkimResults.filter((d) => d.present);

    const snap: MailConfigSnapshot = {
      host,
      queriedAt: new Date().toISOString(),
      mx: mx
        .map((m) => ({ exchange: m.exchange, priority: m.priority }))
        .sort((a, b) => a.priority - b.priority),
      spf: { present: spfRecords.length > 0, records: spfRecords },
      dmarc: { present: dmarcRecords.length > 0, records: dmarcRecords },
      dkim: {
        selectorsTried: [...selectors],
        found,
      },
      txt: txtRoot,
    };
    return mailConfigSnapshotSchema.parse(snap);
  } finally {
    cleanup();
  }
}
