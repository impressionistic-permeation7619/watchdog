import { z } from "zod";

import { validationToolsError } from "../errors/tools-error";

export const pgpKeySchema = z.object({
  /** Key id / fingerprint string from HKP index (may be short id). */
  fingerprint: z.string(),
  uids: z.array(z.string()),
  created: z.string().nullable(),
  expires: z.string().nullable(),
});

export const pgpLookupSnapshotSchema = z.object({
  query: z.string().min(1),
  queriedAt: z.string().min(1),
  source: z.string().nullable(),
  keys: z.array(pgpKeySchema),
});

export type PgpKeyHit = z.infer<typeof pgpKeySchema>;
export type PgpLookupSnapshot = z.infer<typeof pgpLookupSnapshotSchema>;

const KEYSERVERS = [
  "https://keys.openpgp.org",
  "https://keyserver.ubuntu.com",
] as const;

function epochIso(raw: string | undefined): string | null {
  const text = (raw ?? "").trim();
  if (!text || text === "0") return null;
  const n = Number(text);
  if (!Number.isFinite(n)) return null;
  try {
    return new Date(n * 1000).toISOString();
  } catch {
    return null;
  }
}

/** Parse machine-readable HKP index (info:/pub:/uid: lines). */
export function parseHkpMrIndex(body: string): PgpKeyHit[] {
  const keys: PgpKeyHit[] = [];
  let current: PgpKeyHit | null = null;
  for (const line of body.split(/\r?\n/)) {
    if (line.startsWith("pub:")) {
      if (current !== null) keys.push(current);
      const parts = line.split(":");
      current = {
        fingerprint: parts[4] ?? "",
        uids: [],
        created: epochIso(parts[5]),
        expires: epochIso(parts[6]),
      };
    } else if (line.startsWith("uid:") && current !== null) {
      const parts = line.split(":");
      const uid = parts[1] ?? "";
      if (uid !== "") current.uids.push(uid);
    }
  }
  if (current !== null) keys.push(current);
  return keys.filter((k) => k.fingerprint !== "");
}

/**
 * HKP lookup across public keyservers (keys.openpgp.org first).
 * Query: email, fingerprint, or key id.
 */
export async function fetchPgpLookup(
  queryRaw: string,
  signal: AbortSignal,
  options?: { userAgent?: string }
): Promise<PgpLookupSnapshot> {
  const query = queryRaw.trim();
  if (!query) throw validationToolsError("PGP query required");
  const ua = options?.userAgent ?? "Watchdog/1.0 (+identity.pgp.lookup; OSINT)";

  let source: string | null = null;
  let keys: PgpKeyHit[] = [];

  for (const base of KEYSERVERS) {
    const url = `${base}/pks/lookup?op=index&options=mr&search=${encodeURIComponent(query)}`;
    try {
      // oxlint-disable-next-line no-await-in-loop -- ordered keyserver fallback; stops at first hit, must stay sequential
      const res = await fetch(url, {
        method: "GET",
        signal,
        headers: { "User-Agent": ua, Accept: "text/plain" },
      });
      if (!res.ok) continue;
      // oxlint-disable-next-line no-await-in-loop -- same ordered fallback as above
      const text = await res.text();
      const parsed = parseHkpMrIndex(text);
      if (parsed.length > 0) {
        keys = parsed;
        source = base;
        break;
      }
    } catch {
      // try next
    }
  }

  return pgpLookupSnapshotSchema.parse({
    query,
    queriedAt: new Date().toISOString(),
    source,
    keys,
  });
}
