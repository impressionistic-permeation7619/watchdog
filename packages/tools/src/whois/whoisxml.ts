import { z } from "zod";

import { httpToolsError } from "../errors/tools-error";
import type { WhoisSnapshot } from "./schema";
import { parseWhoisDate, whoisStatusList } from "./shared";

const whoisXmlResponseSchema = z.object({
  WhoisRecord: z
    .object({
      registrarName: z.string().optional(),
      createdDate: z.string().optional(),
      expiresDate: z.string().optional(),
      registryData: z
        .object({
          registrarName: z.string().optional(),
          createdDate: z.string().optional(),
          expiresDate: z.string().optional(),
        })
        .optional(),
      registrant: z
        .object({
          organization: z.string().optional(),
          name: z.string().optional(),
        })
        .optional(),
      nameServers: z
        .object({ hostNames: z.array(z.string()).optional() })
        .optional(),
      status: z.union([z.string(), z.array(z.string())]).optional(),
    })
    .optional(),
});

function whoisXmlDates(
  rec: NonNullable<z.infer<typeof whoisXmlResponseSchema>["WhoisRecord"]>
): { registeredAt: string | null; expiresAt: string | null } {
  const registry = rec.registryData;
  return {
    registeredAt:
      parseWhoisDate(rec.createdDate) ?? parseWhoisDate(registry?.createdDate),
    expiresAt:
      parseWhoisDate(rec.expiresDate) ?? parseWhoisDate(registry?.expiresDate),
  };
}

function pickWhoisField(
  primary: string | undefined,
  fallback: string | undefined
): string | null {
  return primary ?? fallback ?? null;
}

function whoisXmlSnapshot(
  host: string,
  raw: z.infer<typeof whoisXmlResponseSchema>
): WhoisSnapshot {
  const rec = raw.WhoisRecord ?? {};
  const registry = rec.registryData;
  const dates = whoisXmlDates(rec);
  const registrant = rec.registrant;
  return {
    host,
    source: "whoisxml",
    registrar: pickWhoisField(rec.registrarName, registry?.registrarName),
    registrantOrg: pickWhoisField(
      registrant?.organization,
      registrant?.name
    ),
    nameservers: rec.nameServers?.hostNames ?? [],
    status: whoisStatusList(rec.status),
    registeredAt: dates.registeredAt,
    expiresAt: dates.expiresAt,
    raw,
  };
}

export async function fetchWhoisXml(
  host: string,
  apiKey: string,
  signal: AbortSignal
): Promise<WhoisSnapshot> {
  const url = new URL("https://www.whoisxmlapi.com/whoisserver/WhoisService");
  url.searchParams.set("apiKey", apiKey);
  url.searchParams.set("domainName", host);
  url.searchParams.set("outputFormat", "JSON");
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw httpToolsError(
      "WhoisXML",
      res.status,
      `WhoisXML ${res.status} for ${host}`
    );
  }
  const raw = whoisXmlResponseSchema.parse(await res.json());
  return whoisXmlSnapshot(host, raw);
}
