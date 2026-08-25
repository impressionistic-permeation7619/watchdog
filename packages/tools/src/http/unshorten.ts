import { isIP, isIPv4 } from "node:net";

import { z } from "zod";

export const unshortenSnapshotSchema = z.object({
  url: z.string().min(1),
  queriedAt: z.string().min(1),
  chain: z.array(
    z.object({
      url: z.string(),
      status: z.number(),
    })
  ),
  finalUrl: z.string(),
  hopCount: z.number().int().nonnegative(),
  error: z.string().optional(),
});

export type UnshortenSnapshot = z.infer<typeof unshortenSnapshotSchema>;

/** Block private, loopback, link-local, and CGNAT hop URLs. */
export function isBlockedUnshortenUrl(raw: string): boolean {
  let hostname: string;
  try {
    hostname = new URL(raw).hostname.replace(/^\[/, "").replace(/\]$/, "");
  } catch {
    return true;
  }
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (!isIP(host)) return false;
  if (host === "::1" || host.startsWith("fe80:")) return true;
  if (host.startsWith("fc") || host.startsWith("fd")) return true;
  if (!isIPv4(host)) return false;
  const octets = host.split(".").map(Number);
  const a = octets[0] ?? 0;
  const b = octets[1] ?? 0;
  if (a === 10 || a === 127) return true;
  if (a === 0 || (a === 169 && b === 254)) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 100 && b >= 64 && b <= 127) return true;
  return false;
}

/**
 * Follow redirects without downloading bodies — records the hop chain.
 * Capacitively capped (maxHops) to avoid loops.
 */
export async function fetchUnshorten(
  url: string,
  signal: AbortSignal,
  options: { userAgent: string; maxHops?: number }
): Promise<UnshortenSnapshot> {
  const maxHops = options.maxHops ?? 10;
  const chain: { url: string; status: number }[] = [];
  let current = url;
  let error: string | undefined;

  for (let i = 0; i < maxHops; i += 1) {
    if (signal.aborted) {
      error = "Unshorten aborted";
      break;
    }
    if (isBlockedUnshortenUrl(current)) {
      error = `Blocked unshorten hop (private/loopback): ${current}`;
      break;
    }
    try {
      // oxlint-disable-next-line no-await-in-loop -- redirect chain must follow hops in order
      const res = await fetch(current, {
        method: "HEAD",
        redirect: "manual",
        signal,
        headers: { "User-Agent": options.userAgent, Accept: "*/*" },
      });
      chain.push({ url: current, status: res.status });
      const loc = res.headers.get("location");
      if (
        loc &&
        (res.status === 301 ||
          res.status === 302 ||
          res.status === 303 ||
          res.status === 307 ||
          res.status === 308)
      ) {
        current = new URL(loc, current).href;
        continue;
      }
      // Some shorteners reject HEAD — try GET with manual redirects.
      if (res.status === 405 || res.status === 501) {
        // oxlint-disable-next-line no-await-in-loop -- same redirect chain as above, must stay in hop order
        const get = await fetch(current, {
          method: "GET",
          redirect: "manual",
          signal,
          headers: {
            "User-Agent": options.userAgent,
            Accept: "*/*",
            Range: "bytes=0-0",
          },
        });
        chain[chain.length - 1] = { url: current, status: get.status };
        const getLoc = get.headers.get("location");
        if (
          getLoc &&
          (get.status === 301 ||
            get.status === 302 ||
            get.status === 303 ||
            get.status === 307 ||
            get.status === 308)
        ) {
          current = new URL(getLoc, current).href;
          continue;
        }
      }
      break;
    } catch (caughtError) {
      error =
        caughtError instanceof Error
          ? caughtError.message
          : String(caughtError);
      break;
    }
  }

  const last = chain.at(-1);
  const finalUrl = last?.url ?? url;
  // If last hop redirected into `current` but we broke, prefer current when chain ended mid-redirect
  const resolvedFinal =
    last &&
    (last.status === 301 ||
      last.status === 302 ||
      last.status === 303 ||
      last.status === 307 ||
      last.status === 308) &&
    current !== last.url
      ? current
      : finalUrl;

  return unshortenSnapshotSchema.parse({
    url,
    queriedAt: new Date().toISOString(),
    chain,
    finalUrl: resolvedFinal,
    hopCount: Math.max(0, chain.length - 1),
    ...(error ? { error } : {}),
  });
}
