import { z } from "zod";

import {
  httpToolsError,
  missingApiKey,
  parseToolsError,
  rateLimitedToolsError,
  validationToolsError,
} from "../errors/tools-error";
import { watchdogUserAgent } from "../errors/user-agent";
import { isRecord } from "../parse/coerce";

export const safebrowsingMatchSchema = z.object({
  threatType: z.string(),
  platformType: z.string(),
});

export const safebrowsingLookupSnapshotSchema = z.object({
  url: z.string().min(1),
  queriedAt: z.string().min(1),
  source: z.literal("safebrowsing.googleapis.com"),
  found: z.boolean(),
  matches: z.array(safebrowsingMatchSchema),
});

export type SafebrowsingMatch = z.infer<typeof safebrowsingMatchSchema>;
export type SafebrowsingLookupSnapshot = z.infer<
  typeof safebrowsingLookupSnapshotSchema
>;

const THREAT_TYPES = [
  "MALWARE",
  "SOCIAL_ENGINEERING",
  "UNWANTED_SOFTWARE",
  "POTENTIALLY_HARMFUL_APPLICATION",
];

/**
 * Google Safe Browsing v4 `threatMatches.find` — URL threat-list membership.
 * POST https://safebrowsing.googleapis.com/v4/threatMatches:find?key=…
 * @see https://developers.google.com/safe-browsing/v4/lookup-api
 */

interface SafebrowsingOptions {
  userAgent?: string;
}
export async function fetchSafebrowsingLookup(
  urlRaw: string,
  apiKey: string,
  signal: AbortSignal,
  options?: SafebrowsingOptions
): Promise<SafebrowsingLookupSnapshot> {
  const url = urlRaw.trim();
  if (!url) throw validationToolsError("url required");
  const key = apiKey.trim();
  if (!key) throw missingApiKey("GOOGLE_SAFEBROWSING_API_KEY");

  const ua =
    options?.userAgent ?? watchdogUserAgent("threat.safebrowsing.lookup");

  const res = await fetch(
    `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${encodeURIComponent(key)}`,
    {
      method: "POST",
      signal,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": ua,
      },
      body: JSON.stringify({
        client: { clientId: "watchdog", clientVersion: "1.0" },
        threatInfo: {
          threatTypes: THREAT_TYPES,
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }],
        },
      }),
    }
  );

  if (res.status === 429) {
    throw rateLimitedToolsError("Safe Browsing", url);
  }
  if (!res.ok) {
    throw httpToolsError(
      "Safe Browsing API",
      res.status,
      `Safe Browsing API ${res.status} for ${url}`
    );
  }

  const body: unknown = await res.json();
  if (!isRecord(body)) {
    throw parseToolsError("Safe Browsing", url);
  }
  const rawMatches = Array.isArray(body.matches) ? body.matches : [];
  const matches: SafebrowsingMatch[] = [];
  for (const row of rawMatches) {
    if (!isRecord(row)) continue;
    if (
      typeof row.threatType !== "string" ||
      typeof row.platformType !== "string"
    ) {
      continue;
    }
    matches.push({
      threatType: row.threatType,
      platformType: row.platformType,
    });
  }

  return safebrowsingLookupSnapshotSchema.parse({
    url,
    queriedAt: new Date().toISOString(),
    source: "safebrowsing.googleapis.com",
    found: matches.length > 0,
    matches,
  });
}
