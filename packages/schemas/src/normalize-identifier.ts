import type { IdentifierType } from "./vocab";

const TRACKING_PARAMS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "fbclid",
  "gclid",
  "mc_cid",
  "mc_eid",
]);

function normalizeIpValue(raw: string): string {
  const trimmed = raw.trim().replace(/^\[/, "").replace(/\]$/, "");
  if (trimmed.includes(":")) {
    return trimmed.toLowerCase();
  }
  return trimmed;
}

function normalizeUrlValue(raw: string): string {
  let candidate = raw;
  if (
    !/^https?:\/\//i.test(candidate) &&
    /^[\w.-]+\.[a-z]{2,}/i.test(candidate)
  ) {
    candidate = `https://${candidate}`;
  }
  try {
    const url = new URL(candidate);
    url.hash = "";
    url.hostname = url.hostname.toLowerCase();
    const kept = new URLSearchParams();
    for (const [k, v] of url.searchParams) {
      if (!TRACKING_PARAMS.has(k.toLowerCase())) kept.append(k, v);
    }
    url.search = kept.toString() ? `?${kept.toString()}` : "";
    // Prefer bare hostname form when no path/query beyond /
    let out = url.toString();
    if (out.endsWith("/") && url.pathname === "/" && !url.search) {
      out = out.slice(0, -1);
    }
    return out;
  } catch {
    return raw.toLowerCase();
  }
}

/**
 * Canonicalize identifier values for storage / unique-index stability.
 * - email / url hosts → lowercase
 * - phone → digits (+ leading + preserved when present)
 * - url → strip hash + common tracking params
 * - pgp fingerprints → strip spaces/colons, uppercase hex (armored keys stay trimmed)
 * - domain → lowercase host (strip scheme/path)
 * - ip → trim, strip [brackets], lowercase IPv6 hex
 * - handle / credential / crypto / other → trimmed as written
 */
export function normalizeIdentifierValue(
  // oxlint-disable-next-line typescript/no-redundant-type-constituents -- IdentifierType kept for docs/autocomplete; callers may also pass unvalidated raw JSON `type` values
  type: IdentifierType | string,
  value: string
): string {
  const raw = value.trim();
  if (!raw) return raw;

  switch (type) {
    case "email": {
      return raw.toLowerCase();
    }
    case "phone": {
      const hasPlus = raw.startsWith("+");
      const digits = raw.replaceAll(/\D/g, "");
      return hasPlus ? `+${digits}` : digits;
    }
    case "url": {
      return normalizeUrlValue(raw);
    }
    case "domain": {
      return raw
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/\/.*$/, "")
        .replace(/\.$/, "")
        .replace(/^\*\./, "");
    }
    case "pgp": {
      const compact = raw.replaceAll(/[\s:]+/g, "");
      // Key id (16) or fingerprint (40+) hex — canonicalize casing/separators.
      if (/^[0-9a-fA-F]{16,}$/.test(compact)) {
        return compact.toUpperCase();
      }
      return raw;
    }
    case "ip": {
      return normalizeIpValue(raw);
    }
    case "handle":
    case "credential":
    case "crypto":
    case "other": {
      return raw;
    }
    default: {
      return raw;
    }
  }
}
