import { z } from "zod";

import {
  httpToolsError,
  parseToolsError,
  rateLimitedToolsError,
  validationToolsError,
} from "../errors/tools-error";
import { asString, isRecord, recordRows } from "../parse/coerce";
import { watchdogUserAgent } from "../errors/user-agent";

export const HASHLOOKUP_ALGOS = ["md5", "sha1", "sha256", "sha512"] as const;
export type HashlookupAlgo = (typeof HASHLOOKUP_ALGOS)[number];

export const hashlookupSnapshotSchema = z.object({
  hash: z.string().min(1),
  algo: z.enum(HASHLOOKUP_ALGOS),
  queriedAt: z.string().min(1),
  source: z.literal("hashlookup.circl.lu"),
  found: z.boolean(),
  trust: z.union([z.number(), z.string()]).nullable(),
  fileName: z.string().nullable(),
  product: z.string().nullable(),
  md5: z.string().nullable(),
  sha1: z.string().nullable(),
  sha256: z.string().nullable(),
  parentCount: z.number().int().nullable(),
  childCount: z.number().int().nullable(),
});

export type HashlookupSnapshot = z.infer<typeof hashlookupSnapshotSchema>;

/** Normalize + validate a hex hash string, throws on unsupported length. */
export function normalizeHashlookupHash(raw: string): string {
  const hash = raw.trim().toLowerCase();
  if (!/^[a-f0-9]+$/.test(hash)) {
    throw validationToolsError(`Invalid hex hash: ${raw}`);
  }
  return hash;
}

function algoForHash(hash: string): HashlookupAlgo {
  switch (hash.length) {
    case 32: {
      return "md5";
    }
    case 40: {
      return "sha1";
    }
    case 64: {
      return "sha256";
    }
    case 128: {
      return "sha512";
    }
    default: {
      throw validationToolsError(
        `Unsupported hash length ${hash.length} for CIRCL hashlookup (expected MD5/SHA1/SHA256/SHA512)`
      );
    }
  }
}

function firstProductName(body: Record<string, unknown>): string | null {
  const products = recordRows(body.products);
  const first = products[0];
  if (!first) return null;
  return asString(first.ProductName);
}

/**
 * CIRCL hashlookup — known-file corpus (NSRL-derived), not a malware verdict.
 * GET https://hashlookup.circl.lu/lookup/{md5|sha1|sha256|sha512}/{hash}
 * @see https://hashlookup.circl.lu/
 */
export async function fetchHashlookup(
  hashRaw: string,
  signal: AbortSignal,
  options?: { userAgent?: string }
): Promise<HashlookupSnapshot> {
  const hash = normalizeHashlookupHash(hashRaw);
  const algo = algoForHash(hash);
  const ua =
    options?.userAgent ?? watchdogUserAgent("threat.hashlookup.lookup");

  const res = await fetch(
    `https://hashlookup.circl.lu/lookup/${algo}/${hash}`,
    {
      method: "GET",
      signal,
      headers: { Accept: "application/json", "User-Agent": ua },
    }
  );

  if (res.status === 404) {
    return hashlookupSnapshotSchema.parse({
      hash,
      algo,
      queriedAt: new Date().toISOString(),
      source: "hashlookup.circl.lu",
      found: false,
      trust: null,
      fileName: null,
      product: null,
      md5: null,
      sha1: null,
      sha256: null,
      parentCount: null,
      childCount: null,
    });
  }
  if (res.status === 429) {
    throw rateLimitedToolsError("CIRCL hashlookup", hash);
  }
  if (!res.ok) {
    throw httpToolsError(
      "CIRCL hashlookup API",
      res.status,
      `CIRCL hashlookup API ${res.status} for ${hash}`
    );
  }

  const body: unknown = await res.json();
  if (!isRecord(body)) {
    throw parseToolsError("CIRCL hashlookup", hash);
  }
  const trustRaw = body["hashlookup:trust"];
  const trust =
    typeof trustRaw === "number" || typeof trustRaw === "string"
      ? trustRaw
      : null;

  return hashlookupSnapshotSchema.parse({
    hash,
    algo,
    queriedAt: new Date().toISOString(),
    source: "hashlookup.circl.lu",
    found: true,
    trust,
    fileName: asString(body.FileName),
    product: firstProductName(body),
    md5: asString(body.MD5),
    sha1: asString(body["SHA-1"]),
    sha256: asString(body["SHA-256"]),
    parentCount: Array.isArray(body.parents) ? body.parents.length : null,
    childCount: Array.isArray(body.children) ? body.children.length : null,
  });
}
