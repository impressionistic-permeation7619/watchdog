import type { CapIoKind } from "@watchdog/cap-sdk";
import {
  PLAYBOOK_SEED_KINDS,
  type JsonObject,
  type PlaybookSeedKind,
} from "@watchdog/schemas";

export type { PlaybookSeedKind };
export { PLAYBOOK_SEED_KINDS };

export interface SeedValues {
  host?: string;
  url?: string;
  evidenceId?: string;
  entityId?: string;
  ip?: string;
  email?: string;
  hash?: string;
  handle?: string;
}

const SEED_JSON_KEYS = [
  "host",
  "url",
  "evidenceId",
  "entityId",
  "ip",
  "email",
  "hash",
  "handle",
] as const;

type SeedJsonKey = (typeof SEED_JSON_KEYS)[number];

const SEED_FIELD: Record<PlaybookSeedKind, SeedJsonKey> = {
  host: "host",
  url: "url",
  evidence: "evidenceId",
  ip: "ip",
  email: "email",
  hash: "hash",
  handle: "handle",
};

const SEED_IO: Record<PlaybookSeedKind, CapIoKind> = {
  host: { kind: "host" },
  url: { kind: "url" },
  evidence: { kind: "evidence", evidenceKind: "file" },
  ip: { kind: "ip" },
  email: { kind: "identifier", type: "email" },
  hash: { kind: "hash" },
  handle: { kind: "identifier", type: "handle" },
};

const QUERY_ORDER: readonly PlaybookSeedKind[] = [
  "email",
  "handle",
  "ip",
  "url",
  "host",
];

export function seedKindToCapIo(kind: PlaybookSeedKind): CapIoKind {
  return SEED_IO[kind];
}

export function hostFromUrl(url: string): string | undefined {
  try {
    const hostname = new URL(url).hostname.trim().toLowerCase();
    if (hostname === "") return undefined;
    return hostname.replace(/\.$/, "");
  } catch {
    return undefined;
  }
}

export function seedField(
  seed: SeedValues,
  kind: PlaybookSeedKind
): string | undefined {
  if (kind === "host") {
    return seed.host ?? (seed.url ? hostFromUrl(seed.url) : undefined);
  }
  return seed[SEED_FIELD[kind]];
}

export function presentSeedKinds(seed: SeedValues): Set<PlaybookSeedKind> {
  const present = new Set<PlaybookSeedKind>();
  for (const kind of PLAYBOOK_SEED_KINDS) {
    const value = seedField(seed, kind)?.trim();
    if (value !== undefined && value !== "") present.add(kind);
  }
  return present;
}

function primaryQuery(seed: SeedValues): string | undefined {
  for (const kind of QUERY_ORDER) {
    const value = seedField(seed, kind)?.trim();
    if (value) return value;
  }
  return undefined;
}

export function seedValuesToCandidateInput(
  seed: SeedValues
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of SEED_JSON_KEYS) {
    const value = seed[key];
    if (value !== undefined) out[key] = value;
  }
  if (seed.evidenceId !== undefined) out.sourceEvidenceId = seed.evidenceId;
  if (out.host === undefined && seed.url !== undefined) {
    const derived = hostFromUrl(seed.url);
    if (derived !== undefined) out.host = derived;
  }
  const query = primaryQuery(seed);
  if (query !== undefined) out.query = query;
  return out;
}

export function seedValuesToJson(seed: SeedValues): JsonObject {
  const out: JsonObject = {};
  for (const key of SEED_JSON_KEYS) {
    const value = seed[key];
    if (value !== undefined) out[key] = value;
  }
  return out;
}

export function seedValuesFromJson(seed: JsonObject): SeedValues {
  const out: SeedValues = {};
  for (const key of SEED_JSON_KEYS) {
    const value = seed[key];
    if (typeof value === "string" && value.trim() !== "") {
      out[key] = value;
    }
  }
  return out;
}
