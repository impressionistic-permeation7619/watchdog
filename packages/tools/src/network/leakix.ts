import { z } from "zod";

import {
  httpToolsError,
  missingApiKey,
  parseToolsError,
  rateLimitedToolsError,
} from "../errors/tools-error";
import { classifyIpOrHost } from "../parse/classify-ip-or-host";
import { asString, isRecord } from "../parse/coerce";
import { watchdogUserAgent } from "../errors/user-agent";

export const leakixLookupSnapshotSchema = z.object({
  query: z.string().min(1),
  kind: z.enum(["ip", "domain"]),
  queriedAt: z.string().min(1),
  source: z.literal("leakix.net"),
  found: z.boolean(),
  serviceCount: z.number().int(),
  leakCount: z.number().int(),
  protocols: z.array(z.string()),
  hostnames: z.array(z.string()),
});

export type LeakixLookupSnapshot = z.infer<typeof leakixLookupSnapshotSchema>;

const MAX_PROTOCOLS = 5;

function firstArray(body: Record<string, unknown>, keys: string[]): unknown[] {
  for (const key of keys) {
    const value = body[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

/**
 * LeakIX host/domain lookup — exposed-service + leak counts, no raw leak
 * bodies. `/host/{ip}` for IPs, `/domain/{host}` for hostnames/domains.
 * @see https://docs.leakix.net/docs/api/hostdetails/
 */

type LeakixOptions = { userAgent?: string };
export async function fetchLeakixLookup(
  queryRaw: string,
  apiKey: string,
  signal: AbortSignal,
  options?: LeakixOptions
): Promise<LeakixLookupSnapshot> {
  const key = apiKey.trim();
  if (!key) throw missingApiKey("LEAKIX_API_KEY");

  const { kind, value } = classifyIpOrHost(queryRaw);
  const ua =
    options?.userAgent ?? watchdogUserAgent("network.leakix.lookup");
  const path = kind === "ip" ? "host" : "domain";
  const url = `https://leakix.net/${path}/${encodeURIComponent(value)}`;

  const res = await fetch(url, {
    method: "GET",
    signal,
    headers: {
      Accept: "application/json",
      "api-key": key,
      "User-Agent": ua,
    },
  });

  if (res.status === 404) {
    return leakixLookupSnapshotSchema.parse({
      query: value,
      kind,
      queriedAt: new Date().toISOString(),
      source: "leakix.net",
      found: false,
      serviceCount: 0,
      leakCount: 0,
      protocols: [],
      hostnames: [],
    });
  }
  if (res.status === 429) {
    throw rateLimitedToolsError("LeakIX", value);
  }
  if (!res.ok) {
    throw httpToolsError(
      "LeakIX API",
      res.status,
      `LeakIX API ${res.status} for ${value}`
    );
  }

  const body: unknown = await res.json();
  if (!isRecord(body)) {
    throw parseToolsError("LeakIX", value);
  }
  const services = firstArray(body, ["Services", "services"]);
  const leaks = firstArray(body, ["Leaks", "leaks"]);

  const protocols = new Set<string>();
  const hostnames = new Set<string>();
  for (const svc of services) {
    if (!isRecord(svc)) continue;
    const protocol = asString(svc.protocol);
    if (protocol) protocols.add(protocol);
    for (const field of ["domain", "hostname", "host"] as const) {
      const name = asString(svc[field])?.trim();
      if (!name || name === value) continue;
      hostnames.add(name);
    }
  }

  return leakixLookupSnapshotSchema.parse({
    query: value,
    kind,
    queriedAt: new Date().toISOString(),
    source: "leakix.net",
    found: services.length > 0 || leaks.length > 0,
    serviceCount: services.length,
    leakCount: leaks.length,
    protocols: [...protocols].slice(0, MAX_PROTOCOLS),
    hostnames: [...hostnames],
  });
}
