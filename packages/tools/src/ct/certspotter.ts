import { z } from "zod";

import { asStringEmpty as asString, isRecord } from "../parse/coerce";
import {
  httpToolsError,
  rateLimitedToolsError,
} from "../errors/tools-error";
import { normalizeHost } from "../whois/normalize";

export const certspotterIssuanceSchema = z.object({
  id: z.string(),
  dnsNames: z.array(z.string()),
  notBefore: z.string().nullable(),
  notAfter: z.string().nullable(),
  revoked: z.boolean().nullable(),
  certSha256: z.string().nullable(),
});

export const certspotterLookupSnapshotSchema = z.object({
  host: z.string().min(1),
  queriedAt: z.string().min(1),
  source: z.literal("api.certspotter.com/v1/issuances"),
  domains: z.array(z.string()),
  issuances: z.array(certspotterIssuanceSchema),
});

export type CertspotterIssuance = z.infer<typeof certspotterIssuanceSchema>;
export type CertspotterLookupSnapshot = z.infer<
  typeof certspotterLookupSnapshotSchema
>;

/**
 * Cert Spotter CT issuances (SSLMate) — second CT source beside crt.sh.
 * GET https://api.certspotter.com/v1/issuances?domain=&include_subdomains=true&expand=dns_names
 * @see https://sslmate.com/certspotter/api/
 */
export async function fetchCertspotterLookup(
  hostRaw: string,
  signal: AbortSignal,
  options?: { userAgent?: string; limit?: number }
): Promise<CertspotterLookupSnapshot> {
  const host = normalizeHost(hostRaw);
  const limit = options?.limit ?? 100;
  const ua =
    options?.userAgent ?? "Watchdog/1.0 (+network.certspotter.lookup; OSINT)";

  const url = new URL("https://api.certspotter.com/v1/issuances");
  url.searchParams.set("domain", host);
  url.searchParams.set("include_subdomains", "true");
  url.searchParams.set("expand", "dns_names");

  const res = await fetch(url, {
    method: "GET",
    signal,
    headers: { Accept: "application/json", "User-Agent": ua },
  });

  if (res.status === 429) {
    throw rateLimitedToolsError("Cert Spotter", host);
  }
  if (!res.ok) {
    throw httpToolsError(
      "Cert Spotter API",
      res.status,
      `Cert Spotter API ${res.status} for ${host}`
    );
  }

  const body: unknown = await res.json();
  const rows = Array.isArray(body) ? body : [];
  const issuances: CertspotterIssuance[] = [];
  const domains: string[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    if (!isRecord(row)) continue;
    const idRaw = row.id;
    const id =
      typeof idRaw === "number" && Number.isFinite(idRaw)
        ? String(idRaw)
        : asString(idRaw);
    if (!id) continue;

    const dnsNamesRaw = Array.isArray(row.dns_names) ? row.dns_names : [];
    const dnsNames: string[] = [];
    for (const n of dnsNamesRaw) {
      if (typeof n !== "string") continue;
      try {
        const d = normalizeHost(n.replace(/^\*\./, ""));
        dnsNames.push(d);
        if (!seen.has(d)) {
          seen.add(d);
          domains.push(d);
        }
      } catch {
        /* skip */
      }
    }

    issuances.push({
      id,
      dnsNames,
      notBefore: asString(row.not_before) || null,
      notAfter: asString(row.not_after) || null,
      revoked: typeof row.revoked === "boolean" ? row.revoked : null,
      certSha256: asString(row.cert_sha256) || null,
    });

    if (issuances.length >= limit) break;
  }

  return certspotterLookupSnapshotSchema.parse({
    host,
    queriedAt: new Date().toISOString(),
    source: "api.certspotter.com/v1/issuances",
    domains,
    issuances,
  });
}
