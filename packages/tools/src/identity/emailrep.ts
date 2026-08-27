import { z } from "zod";

import {
  httpToolsError,
  parseToolsError,
  rateLimitedToolsError,
  validationToolsError,
} from "../errors/tools-error";
import { watchdogUserAgent } from "../errors/user-agent";
import { asBool, asNumber, asString, isRecord } from "../parse/coerce";

export const emailrepLookupSnapshotSchema = z.object({
  email: z.string().min(1),
  queriedAt: z.string().min(1),
  source: z.literal("emailrep.io"),
  found: z.boolean(),
  reputation: z.string().nullable(),
  suspicious: z.boolean(),
  references: z.number().int().nullable(),
  credentialsLeaked: z.boolean().nullable(),
  maliciousActivity: z.boolean().nullable(),
  dataBreach: z.boolean().nullable(),
  profiles: z.array(z.string()),
  firstSeen: z.string().nullable(),
  lastSeen: z.string().nullable(),
  disposable: z.boolean().nullable(),
  freeProvider: z.boolean().nullable(),
  spoofable: z.boolean().nullable(),
});

export type EmailrepLookupSnapshot = z.infer<
  typeof emailrepLookupSnapshotSchema
>;

/** Map EmailRep JSON including `details.*`. */
export function parseEmailrepBody(
  email: string,
  queriedAt: string,
  body: unknown
): EmailrepLookupSnapshot {
  if (!isRecord(body)) {
    throw parseToolsError("EmailRep", email);
  }
  const details = isRecord(body.details) ? body.details : {};
  const references = asNumber(body.references);
  const profilesRaw = details.profiles;
  const profiles = Array.isArray(profilesRaw)
    ? profilesRaw.flatMap((row) => {
        const value = asString(row);
        return value === null ? [] : [value];
      })
    : [];

  return emailrepLookupSnapshotSchema.parse({
    email,
    queriedAt,
    source: "emailrep.io",
    found: references !== null && references > 0,
    reputation: asString(body.reputation),
    suspicious: body.suspicious === true,
    references,
    credentialsLeaked: asBool(details.credentials_leaked),
    maliciousActivity: asBool(details.malicious_activity),
    dataBreach: asBool(details.data_breach),
    profiles,
    firstSeen: asString(details.first_seen),
    lastSeen: asString(details.last_seen),
    disposable: asBool(details.disposable),
    freeProvider: asBool(details.free_provider),
    spoofable: asBool(details.spoofable),
  });
}

async function emailrepFailReason(res: Response): Promise<string> {
  try {
    const errBody: unknown = await res.json();
    if (isRecord(errBody) && typeof errBody.reason === "string") {
      return errBody.reason.trim();
    }
  } catch {
    /* ignore */
  }
  return "";
}

/**
 * EmailRep.io reputation lookup — aggregated risk signal for an email
 * address. `User-Agent` is required; unauthenticated queries are rejected
 * (`Key` header required).
 * GET https://emailrep.io/{email}
 * @see https://docs.sublime.security/reference/emailrep-introduction
 */

interface EmailrepOptions {
  apiKey?: string;
  userAgent?: string;
}
export async function fetchEmailrepLookup(
  emailRaw: string,
  signal: AbortSignal,
  options?: EmailrepOptions
): Promise<EmailrepLookupSnapshot> {
  const email = emailRaw.trim().toLowerCase();
  if (!email.includes("@"))
    throw validationToolsError(`Invalid email: ${emailRaw}`);

  const ua =
    options?.userAgent ?? watchdogUserAgent("identity.emailrep.lookup");
  const key = options?.apiKey?.trim() ?? "";

  const headers: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": ua,
  };
  if (key) headers.Key = key;

  const res = await fetch(`https://emailrep.io/${encodeURIComponent(email)}`, {
    method: "GET",
    signal,
    headers,
  });

  if (res.status === 429) {
    const reason = await emailrepFailReason(res);
    if (
      reason.toLowerCase().includes("unauthenticated api is currently disabled")
    ) {
      throw validationToolsError(
        `EmailRep requires an API key (unauthenticated API disabled) for ${email}`
      );
    }
    throw rateLimitedToolsError("EmailRep", email);
  }
  if (res.status === 401) {
    throw validationToolsError(`EmailRep API key invalid for ${email}`);
  }
  if (res.status === 403) {
    throw validationToolsError(
      `EmailRep rejected request (missing User-Agent) for ${email}`
    );
  }
  if (!res.ok) {
    throw httpToolsError(
      "EmailRep API",
      res.status,
      `EmailRep API ${res.status} for ${email}`
    );
  }

  const body: unknown = await res.json();
  return parseEmailrepBody(email, new Date().toISOString(), body);
}
