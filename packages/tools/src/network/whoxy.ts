import { z } from "zod";

import {
  httpToolsError,
  missingApiKey,
  parseToolsError,
} from "../errors/tools-error";
import { watchdogUserAgent } from "../errors/user-agent";
import { isRecord } from "../parse/coerce";
import { normalizeHost } from "../whois/normalize";

export const whoxyLookupSnapshotSchema = z.object({
  host: z.string().min(1),
  queriedAt: z.string().min(1),
  status: z.number().int().nullable(),
  ok: z.boolean(),
  registrarName: z.string().nullable(),
  createDate: z.string().nullable(),
  updateDate: z.string().nullable(),
  expireDate: z.string().nullable(),
  domainRegistrar: z.string().nullable(),
  nameServers: z.array(z.string()),
  registrantName: z.string().nullable(),
  registrantEmail: z.string().nullable(),
  registrantOrg: z.string().nullable(),
  registrantCountry: z.string().nullable(),
  rawStatus: z.union([z.string(), z.number()]).nullable(),
});

export type WhoxyLookupSnapshot = z.infer<typeof whoxyLookupSnapshotSchema>;

function contactField(contact: unknown, key: string): string | null {
  if (!isRecord(contact)) return null;
  const v = contact[key];
  return typeof v === "string" && v.trim() !== "" ? v : null;
}

/**
 * Whoxy live WHOIS —
 * GET https://api.whoxy.com/?key=&whois=domain
 * @see https://www.whoxy.com/
 */

interface WhoxyOptions {
  userAgent?: string;
}
export async function fetchWhoxyWhois(
  hostRaw: string,
  apiKey: string,
  signal: AbortSignal,
  options?: WhoxyOptions
): Promise<WhoxyLookupSnapshot> {
  const host = normalizeHost(hostRaw);
  const key = apiKey.trim();
  if (!key) throw missingApiKey("WHOXY_API_KEY");

  const ua = options?.userAgent ?? watchdogUserAgent("network.whoxy.lookup");
  const url = new URL("https://api.whoxy.com/");
  url.searchParams.set("key", key);
  url.searchParams.set("whois", host);

  const res = await fetch(url, {
    method: "GET",
    signal,
    headers: { Accept: "application/json", "User-Agent": ua },
  });

  if (!res.ok) {
    throw httpToolsError(
      "Whoxy API",
      res.status,
      `Whoxy API ${res.status} for ${host}`
    );
  }

  const body: unknown = await res.json();
  if (!isRecord(body)) {
    throw parseToolsError("Whoxy", host);
  }
  let statusNum: number | null;
  if (typeof body.status === "number") {
    statusNum = body.status;
  } else if (typeof body.status === "string") {
    statusNum = Number(body.status);
  } else {
    statusNum = null;
  }
  const ok = statusNum === 1;

  let nameServers: string[];
  if (Array.isArray(body.name_servers)) {
    nameServers = body.name_servers.filter(
      (n): n is string => typeof n === "string"
    );
  } else if (typeof body.name_servers === "string") {
    nameServers = body.name_servers.split(/[\s,]+/).filter(Boolean);
  } else {
    nameServers = [];
  }

  const registrant = body.registrant_contact;

  const registrarObj = isRecord(body.domain_registrar)
    ? body.domain_registrar
    : null;
  let registrarName: string | null;
  if (typeof registrarObj?.registrar_name === "string") {
    registrarName = registrarObj.registrar_name;
  } else if (typeof body.registrar_name === "string") {
    registrarName = body.registrar_name;
  } else {
    registrarName = null;
  }

  return whoxyLookupSnapshotSchema.parse({
    host,
    queriedAt: new Date().toISOString(),
    status: res.status,
    ok,
    registrarName,
    createDate: typeof body.create_date === "string" ? body.create_date : null,
    updateDate: typeof body.update_date === "string" ? body.update_date : null,
    expireDate: typeof body.expiry_date === "string" ? body.expiry_date : null,
    domainRegistrar: registrarName,
    nameServers,
    registrantName: contactField(registrant, "full_name"),
    registrantEmail: contactField(registrant, "email_address"),
    registrantOrg: contactField(registrant, "company_name"),
    registrantCountry:
      contactField(registrant, "country_name") ??
      contactField(registrant, "country_code"),
    rawStatus:
      typeof body.status === "string" || typeof body.status === "number"
        ? body.status
        : null,
  });
}
