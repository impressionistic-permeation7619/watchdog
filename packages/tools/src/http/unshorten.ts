import { z } from "zod";

import { errorMessage } from "../errors/tools-error";
import {
  isBlockedUnshortenUrl,
  isRedirectResponse,
  isRedirectStatus,
  resolveRedirectUrl,
} from "./unshorten-guards";

export { isBlockedUnshortenUrl } from "./unshorten-guards";

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

type HopResult =
  | { kind: "redirect"; nextUrl: string; status: number }
  | { kind: "done"; status: number };

async function fetchHop(
  current: string,
  method: "HEAD" | "GET",
  signal: AbortSignal,
  userAgent: string
): Promise<Response> {
  return fetch(current, {
    method,
    redirect: "manual",
    signal,
    headers:
      method === "GET"
        ? {
            "User-Agent": userAgent,
            Accept: "*/*",
            Range: "bytes=0-0",
          }
        : { "User-Agent": userAgent, Accept: "*/*" },
  });
}

async function followHop(
  current: string,
  signal: AbortSignal,
  userAgent: string
): Promise<HopResult> {
  const head = await fetchHop(current, "HEAD", signal, userAgent);
  const headLocation = head.headers.get("location");
  if (isRedirectResponse(head.status, headLocation)) {
    return {
      kind: "redirect",
      nextUrl: resolveRedirectUrl(current, headLocation),
      status: head.status,
    };
  }
  if (head.status !== 405 && head.status !== 501) {
    return { kind: "done", status: head.status };
  }

  const get = await fetchHop(current, "GET", signal, userAgent);
  const getLocation = get.headers.get("location");
  if (isRedirectResponse(get.status, getLocation)) {
    return {
      kind: "redirect",
      nextUrl: resolveRedirectUrl(current, getLocation),
      status: get.status,
    };
  }
  return { kind: "done", status: get.status };
}

function resolvedFinalUrl(
  chain: { url: string; status: number }[],
  current: string,
  fallback: string
): string {
  const last = chain.at(-1);
  const finalUrl = last?.url ?? fallback;
  if (last && isRedirectStatus(last.status) && current !== last.url) {
    return current;
  }
  return finalUrl;
}

/**
 * Follow redirects without downloading bodies — records the hop chain.
 * Capacitively capped (maxHops) to avoid loops.
 */

interface UnshortenOptions {
  userAgent: string;
  maxHops?: number;
}
export async function fetchUnshorten(
  url: string,
  signal: AbortSignal,
  options: UnshortenOptions
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
      const hop = await followHop(current, signal, options.userAgent);
      chain.push({ url: current, status: hop.status });
      if (hop.kind === "redirect") {
        current = hop.nextUrl;
        continue;
      }
      break;
    } catch (caughtError) {
      error = errorMessage(caughtError);
      break;
    }
  }

  const finalUrl = resolvedFinalUrl(chain, current, url);

  return unshortenSnapshotSchema.parse({
    url,
    queriedAt: new Date().toISOString(),
    chain,
    finalUrl,
    hopCount: Math.max(0, chain.length - 1),
    ...(error ? { error } : {}),
  });
}
