import { isIP } from "node:net";

import { z } from "zod";

import { normalizeIp } from "../dns/reverse";
import {
  httpToolsError,
  parseToolsError,
  validationToolsError,
} from "../errors/tools-error";
import { isRecord } from "../parse/coerce";
import { normalizeHost } from "../whois/normalize";

export const xforceLookupSnapshotSchema = z.object({
  query: z.string().min(1),
  kind: z.enum(["ip", "domain", "url", "hash"]),
  queriedAt: z.string().min(1),
  source: z.literal("exchange.xforce.ibmcloud.com"),
  found: z.boolean(),
  score: z.number().nullable(),
  cats: z.record(z.string(), z.number()),
  malwareCount: z.number().int(),
});

export type XforceLookupSnapshot = z.infer<typeof xforceLookupSnapshotSchema>;

const HASH_LENGTHS = new Set([32, 40, 64]);
const BASE_URL = "https://exchange.xforce.ibmcloud.com/api";

function classifyXforceQuery(raw: string): {
  kind: "ip" | "domain" | "url" | "hash";
  value: string;
} {
  const trimmed = raw.trim();
  if (/^[a-fA-F0-9]+$/.test(trimmed) && HASH_LENGTHS.has(trimmed.length)) {
    return { kind: "hash", value: trimmed.toLowerCase() };
  }
  if (isIP(trimmed)) {
    return { kind: "ip", value: normalizeIp(trimmed) };
  }
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) {
    return { kind: "url", value: trimmed };
  }
  return { kind: "domain", value: normalizeHost(trimmed) };
}

function normalizeCats(raw: unknown): Record<string, number> {
  if (!isRecord(raw)) return {};
  const cats: Record<string, number> = {};
  for (const [name, value] of Object.entries(raw)) {
    if (typeof value === "number") cats[name] = value;
  }
  return cats;
}

function authHeader(apiKey: string, apiPassword: string): string {
  return `Basic ${Buffer.from(`${apiKey}:${apiPassword}`).toString("base64")}`;
}

/**
 * IBM X-Force Exchange lookup — IP reputation (+ malware count), or URL /
 * malware-hash reports. HTTP Basic auth (API key + password).
 * @see https://api.xforce.ibmcloud.com/doc/
 */
export async function fetchXforceLookup(
  queryRaw: string,
  apiKey: string,
  apiPassword: string,
  signal: AbortSignal,
  options?: { userAgent?: string }
): Promise<XforceLookupSnapshot> {
  const key = apiKey.trim();
  const password = apiPassword.trim();
  if (!key || !password) {
    throw validationToolsError("XFORCE_API_KEY and XFORCE_API_PASSWORD required");
  }

  const { kind, value } = classifyXforceQuery(queryRaw);
  const ua =
    options?.userAgent ?? "Watchdog/1.0 (+threat.xforce.lookup; OSINT)";
  const headers: Record<string, string> = {
    Accept: "application/json",
    Authorization: authHeader(key, password),
    "User-Agent": ua,
  };
  const notFound = (): XforceLookupSnapshot =>
    xforceLookupSnapshotSchema.parse({
      query: value,
      kind,
      queriedAt: new Date().toISOString(),
      source: "exchange.xforce.ibmcloud.com",
      found: false,
      score: null,
      cats: {},
      malwareCount: 0,
    });

  if (kind === "ip") {
    const res = await fetch(`${BASE_URL}/ipr/${encodeURIComponent(value)}`, {
      method: "GET",
      signal,
      headers,
    });
    if (res.status === 404) return notFound();
    if (!res.ok) {
      throw httpToolsError(
        "X-Force API",
        res.status,
        `X-Force API ${res.status} for ${value}`
      );
    }
    const body: unknown = await res.json();
    if (!isRecord(body)) {
      throw parseToolsError("X-Force", value);
    }
    const score = typeof body.score === "number" ? body.score : null;
    const cats = normalizeCats(body.cats);

    let malwareCount = 0;
    const malRes = await fetch(
      `${BASE_URL}/ipr/malware/${encodeURIComponent(value)}`,
      { method: "GET", signal, headers }
    );
    if (malRes.ok) {
      const malBody: unknown = await malRes.json();
      if (isRecord(malBody)) {
        if (Array.isArray(malBody.malware)) {
          malwareCount = malBody.malware.length;
        } else if (typeof malBody.count === "number") {
          malwareCount = malBody.count;
        }
      }
    }

    return xforceLookupSnapshotSchema.parse({
      query: value,
      kind,
      queriedAt: new Date().toISOString(),
      source: "exchange.xforce.ibmcloud.com",
      found: true,
      score,
      cats,
      malwareCount,
    });
  }

  if (kind === "domain" || kind === "url") {
    const res = await fetch(`${BASE_URL}/url/${encodeURIComponent(value)}`, {
      method: "GET",
      signal,
      headers,
    });
    if (res.status === 404) return notFound();
    if (!res.ok) {
      throw httpToolsError(
        "X-Force API",
        res.status,
        `X-Force API ${res.status} for ${value}`
      );
    }
    const body: unknown = await res.json();
    if (!isRecord(body)) {
      throw parseToolsError("X-Force", value);
    }
    const result = isRecord(body.result) ? body.result : body;
    return xforceLookupSnapshotSchema.parse({
      query: value,
      kind,
      queriedAt: new Date().toISOString(),
      source: "exchange.xforce.ibmcloud.com",
      found: true,
      score: typeof result.score === "number" ? result.score : null,
      cats: normalizeCats(result.cats),
      malwareCount: 0,
    });
  }

  // hash
  const res = await fetch(`${BASE_URL}/malware/${encodeURIComponent(value)}`, {
    method: "GET",
    signal,
    headers,
  });
  if (res.status === 404) return notFound();
  if (!res.ok) {
    throw httpToolsError(
      "X-Force API",
      res.status,
      `X-Force API ${res.status} for ${value}`
    );
  }

  return xforceLookupSnapshotSchema.parse({
    query: value,
    kind,
    queriedAt: new Date().toISOString(),
    source: "exchange.xforce.ibmcloud.com",
    found: true,
    score: null,
    cats: {},
    malwareCount: 1,
  });
}
