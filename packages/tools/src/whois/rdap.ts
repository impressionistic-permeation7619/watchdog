import { httpToolsError, parseToolsError } from "../errors/tools-error";
import type { WhoisSnapshot } from "./schema";
import {
  extractVcard,
  readRdapDates,
  readRdapLdhName,
  whoisStatusList,
} from "./shared";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function fetchRdapWhois(
  host: string,
  signal: AbortSignal
): Promise<WhoisSnapshot> {
  const res = await fetch(
    `https://rdap.org/domain/${encodeURIComponent(host)}`,
    {
      signal,
      headers: { Accept: "application/rdap+json, application/json" },
    }
  );
  if (!res.ok) {
    throw httpToolsError("RDAP", res.status, `RDAP ${res.status} for ${host}`);
  }
  const parsed: unknown = await res.json();
  if (!isRecord(parsed)) {
    throw parseToolsError("RDAP", host);
  }
  const raw = parsed;
  const entities = Array.isArray(raw.entities) ? raw.entities : [];
  let registrar: string | null = null;
  let registrantOrg: string | null = null;
  for (const ent of entities) {
    if (!isRecord(ent)) continue;
    const roles = Array.isArray(ent.roles) ? ent.roles.map(String) : [];
    const vcard = Array.isArray(ent.vcardArray) ? ent.vcardArray : null;
    const fn = extractVcard(vcard, "fn");
    const org = extractVcard(vcard, "org");
    if (roles.includes("registrar") && fn !== null && fn !== "") registrar = fn;
    if (roles.includes("registrant")) registrantOrg = org ?? fn;
  }
  const nameservers = Array.isArray(raw.nameservers)
    ? raw.nameservers
        .map(readRdapLdhName)
        .filter((x): x is string => Boolean(x))
    : [];
  const status = whoisStatusList(raw.status);
  const { registeredAt, expiresAt } = readRdapDates(raw);
  return {
    host,
    source: "rdap",
    registrar,
    registrantOrg,
    nameservers,
    status,
    registeredAt,
    expiresAt,
    raw,
  };
}
