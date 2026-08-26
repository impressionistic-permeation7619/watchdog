import type { CapListItem } from "@/domains/jobs/types";

/** Jobs category label from Cap id first segment (`docs/CAPS.md`). */
export const CAP_CATEGORY_LABELS: Record<string, string> = {
  network: "Infrastructure",
  archive: "Archives",
  web: "Live web",
  identity: "Identity",
  breach: "Breaches",
  evidence: "Evidence",
  threat: "Reputation",
  analysis: "Analysis",
  report: "Reports",
  corpus: "Corpus",
  crypto: "Crypto",
  safety: "Safety",
};

export const USE_CASE_FILTERS = [
  { value: "", label: "All intents" },
  { value: "Passive", label: "Passive" },
  { value: "Active", label: "Active" },
  { value: "Footprint", label: "Footprint" },
] as const;

export type PasteSeedKind =
  | "host"
  | "ip"
  | "url"
  | "evidence"
  | "email"
  | "handle"
  | "hash"
  | "unknown";

export interface PasteDetectResult {
  kind: PasteSeedKind;
  value: string;
  /** Normalized host when kind is host (or url host). */
  hostHint?: string;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const IPV4_RE =
  /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const FILE_HASH_RE =
  /^(?:[a-f0-9]{32}|[a-f0-9]{40}|[a-f0-9]{64}|[a-f0-9]{128})$/i;

function looksLikeIpv6(value: string): boolean {
  if (value.includes(".")) return false;
  return /^[0-9a-f:]+$/i.test(value) && value.split(":").length >= 3;
}

function looksLikeIp(value: string): boolean {
  return IPV4_RE.test(value) || looksLikeIpv6(value);
}

/** Detect seed kind from a paste / CapMatch input. */
export function detectPasteSeed(raw: string): PasteDetectResult {
  const value = raw.trim();
  if (!value) return { kind: "unknown", value: "" };
  if (UUID_RE.test(value)) return { kind: "evidence", value };

  if (IPV4_RE.test(value) || (value.includes(":") && looksLikeIpv6(value))) {
    return { kind: "ip", value };
  }

  if (EMAIL_RE.test(value)) {
    return { kind: "email", value: value.toLowerCase() };
  }

  if (/^@[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/i.test(value)) {
    return { kind: "handle", value: value.slice(1).toLowerCase() };
  }

  try {
    const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(value)
      ? value
      : `https://${value}`;
    const u = new URL(withScheme);
    if (u.protocol === "http:" || u.protocol === "https:") {
      const looksLikeUrl =
        /^https?:\/\//i.test(value) ||
        value.includes("/") ||
        value.includes("?");
      if (looksLikeUrl) {
        return { kind: "url", value, hostHint: u.hostname };
      }
      // bare hostname
      if (u.hostname.includes(".") || u.hostname === "localhost") {
        return { kind: "host", value: u.hostname, hostHint: u.hostname };
      }
    }
  } catch {
    // fall through
  }

  if (/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value) || value === "localhost") {
    return {
      kind: "host",
      value: value.toLowerCase(),
      hostHint: value.toLowerCase(),
    };
  }

  if (FILE_HASH_RE.test(value)) {
    return { kind: "hash", value: value.toLowerCase() };
  }

  return { kind: "unknown", value };
}

export function capCategory(id: string): string {
  return id.split(".")[0] ?? "";
}

export function capCategoryLabel(id: string): string {
  const cat = capCategory(id);
  return CAP_CATEGORY_LABELS[cat] ?? cat;
}

/** Paste-facing consume labels for CapMatch (may be multiple per Cap). */
export function capPasteKinds(cap: CapListItem): Set<PasteSeedKind> {
  const out = new Set<PasteSeedKind>();
  for (const c of cap.consumes ?? []) {
    switch (c.kind) {
      case "host": {
        out.add("host");
        break;
      }
      case "ip": {
        out.add("ip");
        break;
      }
      case "url": {
        out.add("url");
        break;
      }
      case "hash": {
        out.add("hash");
        break;
      }
      case "evidence": {
        out.add("evidence");
        break;
      }
      case "identifier": {
        if (c.type === "email") out.add("email");
        if (c.type === "handle") out.add("handle");
        // pgp fingerprints aren't a paste kind yet — email queries match via email consume
        break;
      }
      default: {
        break;
      }
    }
  }
  return out;
}

/** Primary consume kind for ranking (first match wins). */
export function capConsumesKind(
  cap: CapListItem
): Exclude<PasteSeedKind, "unknown"> | null {
  const kinds = capPasteKinds(cap);
  if (kinds.has("ip")) return "ip";
  if (kinds.has("host")) return "host";
  if (kinds.has("email")) return "email";
  if (kinds.has("handle")) return "handle";
  if (kinds.has("url")) return "url";
  if (kinds.has("evidence")) return "evidence";
  if (kinds.has("hash")) return "hash";
  return null;
}

/** Paste kinds a CapMatch seed can satisfy (URL also unlocks host / IP). */
function pasteCompatibleKinds(paste: PasteDetectResult): Set<PasteSeedKind> {
  if (paste.kind !== "url") return new Set([paste.kind]);
  const kinds = new Set<PasteSeedKind>(["url"]);
  const hostHint = paste.hostHint;
  if (hostHint !== undefined && hostHint !== "") {
    kinds.add("host");
    if (looksLikeIp(hostHint)) kinds.add("ip");
  }
  return kinds;
}

export interface CapMatchFilters {
  kindFilter: string;
  categoryFilter: string;
  useCaseFilter: string;
  needsKeyOnly: boolean;
  paste: PasteDetectResult | null;
}

/** Filter + rank Caps for CapMatch / Jobs launcher. */
export function matchCaps(
  caps: readonly CapListItem[],
  filters: CapMatchFilters
): CapListItem[] {
  const pasteKind = filters.paste?.kind;
  const compatible =
    filters.paste && pasteKind !== "unknown"
      ? pasteCompatibleKinds(filters.paste)
      : null;

  const filtered = caps.filter((c) => {
    if (filters.kindFilter && c.kind !== filters.kindFilter) return false;
    if (
      filters.categoryFilter &&
      capCategory(c.id) !== filters.categoryFilter
    ) {
      return false;
    }
    if (filters.useCaseFilter) {
      const cases = c.useCases ?? [];
      if (!cases.includes(filters.useCaseFilter)) return false;
    }
    if (filters.needsKeyOnly && !(c.flags ?? []).includes("needs_key")) {
      return false;
    }
    if (compatible) {
      const kinds = capPasteKinds(c);
      if (kinds.size === 0) return false;
      for (const kind of kinds) {
        if (compatible.has(kind)) return true;
      }
      return false;
    }
    return true;
  });

  if (!pasteKind || pasteKind === "unknown") return filtered;

  return [...filtered].sort((a, b) => {
    const aMatch = capPasteKinds(a).has(pasteKind) ? 0 : 1;
    const bMatch = capPasteKinds(b).has(pasteKind) ? 0 : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;
    return a.title.localeCompare(b.title);
  });
}

/** Distinct categories present in the catalog, labeled. */
export function categoryFilterOptions(
  caps: readonly CapListItem[]
): { value: string; label: string }[] {
  const cats = [...new Set(caps.map((c) => capCategory(c.id)).filter(Boolean))];
  cats.sort();
  return [
    { value: "", label: "All categories" },
    ...cats.map((c) => ({
      value: c,
      label: CAP_CATEGORY_LABELS[c] ?? c,
    })),
  ];
}

/** Group Caps for optgroup-style select labels. */
export function groupCapsByCategory(
  caps: readonly CapListItem[]
): { category: string; label: string; caps: CapListItem[] }[] {
  const map = new Map<string, CapListItem[]>();
  for (const cap of caps) {
    const cat = capCategory(cap.id);
    const list = map.get(cat) ?? [];
    list.push(cap);
    map.set(cat, list);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, list]) => ({
      category,
      label: CAP_CATEGORY_LABELS[category] ?? category,
      caps: list,
    }));
}
