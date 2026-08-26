import {
  httpToolsError,
  parseToolsError,
} from "../errors/tools-error";
import { asStringEmpty as asString, isRecord } from "../parse/coerce";
import { normalizeHost } from "../whois/normalize";
import {
  ctCertEntrySchema,
  ctLookupSnapshotSchema,
  type CtCertEntry,
  type CtLookupSnapshot,
} from "./schema";

const CRT_SH_URL = "https://crt.sh/";

/** crt.sh sometimes concatenates objects `}{` instead of a JSON array. */
export function parseCrtShJson(text: string): unknown[] {
  const trimmed = text.trim();
  if (trimmed === "") return [];
  try {
    const parsed: unknown = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    const wrapped = `[${trimmed.replaceAll("}{", "},{")}]`;
    try {
      const parsed: unknown = JSON.parse(wrapped);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      throw parseToolsError("crt.sh", "response", "crt.sh returned non-JSON");
    }
  }
}

/** Pull host labels from crt.sh CN / SAN blobs (newline-separated). */
export function extractDomainsFromNameValue(raw: string): string[] {
  const out: string[] = [];
  for (const part of raw.split(/[\n\s,]+/)) {
    const label = part.trim();
    if (!label || label.includes(" ")) continue;
    // Skip emails that sometimes appear in name_value
    if (label.includes("@")) continue;
    try {
      out.push(normalizeHost(label.replace(/^\*\./, "")));
    } catch {
      /* skip */
    }
  }
  return out;
}

function entryFromRow(row: unknown): CtCertEntry | null {
  if (!isRecord(row)) return null;
  const commonName = asString(row.common_name);
  const nameValue = asString(row.name_value) || commonName;
  if (!commonName && !nameValue) return null;
  return ctCertEntrySchema.parse({
    commonName: commonName || nameValue.split("\n")[0] || "",
    nameValue,
    issuer: asString(row.issuer_name),
    notBefore: asString(row.not_before),
    notAfter: asString(row.not_after),
    serial: asString(row.serial_number),
  });
}

export interface FetchCrtShOptions {
  /** Max cert rows to keep after dedupe (default 50). */
  limit?: number;
  userAgent?: string;
}

/**
 * Query crt.sh Certificate Transparency for `%.{host}` (and the bare host).
 * Returns structured entries + deduped domain labels — no Cap/Graph types.
 */
export async function fetchCrtShLookup(
  host: string,
  signal?: AbortSignal,
  options: FetchCrtShOptions = {}
): Promise<CtLookupSnapshot> {
  const normalized = normalizeHost(host);
  const limit = options.limit ?? 50;
  const userAgent =
    options.userAgent ?? "Watchdog/1.0 (+network.ct.lookup; OSINT)";

  const url = new URL(CRT_SH_URL);
  url.searchParams.set("q", `%.${normalized}`);
  url.searchParams.set("output", "json");

  const res = await fetch(url, {
    signal,
    headers: { Accept: "application/json", "User-Agent": userAgent },
  });
  if (!res.ok) {
    throw httpToolsError("crt.sh", res.status, `crt.sh HTTP ${res.status}`);
  }

  let payloadText: string;
  try {
    payloadText = await res.text();
  } catch (error) {
    throw parseToolsError(
      "crt.sh",
      normalized,
      `crt.sh read failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  const rows = parseCrtShJson(payloadText);

  const entries: CtCertEntry[] = [];
  const seenEntry = new Set<string>();
  const domainSet = new Set<string>([normalized]);

  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const entry = entryFromRow(row);
    if (entry === null) continue;
    const key = `${entry.commonName}|${entry.serial}|${entry.notBefore}`;
    if (seenEntry.has(key)) continue;
    seenEntry.add(key);
    entries.push(entry);
    for (const d of extractDomainsFromNameValue(entry.nameValue)) {
      if (d.endsWith(`.${normalized}`) || d === normalized) {
        domainSet.add(d);
      }
    }
    for (const d of extractDomainsFromNameValue(entry.commonName)) {
      if (d.endsWith(`.${normalized}`) || d === normalized) {
        domainSet.add(d);
      }
    }
    if (entries.length >= limit) break;
  }

  const domains = [...domainSet].sort((a, b) => a.localeCompare(b));

  return ctLookupSnapshotSchema.parse({
    host: normalized,
    source: "crt.sh",
    queriedAt: new Date().toISOString(),
    entries,
    domains,
  });
}
