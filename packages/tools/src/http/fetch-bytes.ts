import { errorMessage } from "../errors/tools-error";

export interface FetchBytesOptions {
  /** User-Agent header (Cap OPSEC policy — pass from Cap, never hardcode Cap id here). */
  userAgent: string;
  /** Truncate response body to this many bytes. */
  maxBytes: number;
  /** Accept header. */
  accept?: string;
}

export interface FetchBytesResult {
  ok: boolean;
  status: number;
  bytes: Uint8Array;
  contentType: string | null;
  markdownTokensHint?: number;
  finalUrl: string;
  error?: string;
}

/** Dumb fetch + truncate — Cap supplies UA / limits / Accept. */
export async function fetchBytes(
  url: string,
  signal: AbortSignal,
  options: FetchBytesOptions
): Promise<FetchBytesResult> {
  const accept = options.accept ?? "*/*";
  try {
    const res = await fetch(url, {
      signal,
      redirect: "follow",
      headers: {
        Accept: accept,
        "User-Agent": options.userAgent,
      },
    });
    const buf = new Uint8Array(await res.arrayBuffer());
    const truncated =
      buf.byteLength > options.maxBytes ? buf.slice(0, options.maxBytes) : buf;
    const tokenHeader = res.headers.get("x-markdown-tokens");
    const markdownTokensHint =
      tokenHeader !== null && tokenHeader !== ""
        ? Math.trunc(Number(tokenHeader))
        : undefined;
    return {
      ok: res.ok,
      status: res.status,
      bytes: truncated,
      contentType: res.headers.get("content-type"),
      ...(Number.isFinite(markdownTokensHint) ? { markdownTokensHint } : {}),
      finalUrl: res.url || url,
      ...(res.ok ? {} : { error: `HTTP ${res.status}` }),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      bytes: new Uint8Array(),
      contentType: null,
      finalUrl: url,
      error: errorMessage(error),
    };
  }
}
