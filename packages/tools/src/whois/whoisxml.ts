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

function whoisXmlSnapshot(
  host: string,
  raw: z.infer<typeof whoisXmlResponseSchema>
): WhoisSnapshot {
  const rec = raw.WhoisRecord ?? {};
  const registry = rec.registryData;
  return {
    host,
    source: "whoisxml",
    registrar: rec.registrarName ?? registry?.registrarName ?? null,
    registrantOrg:
      rec.registrant?.organization ?? rec.registrant?.name ?? null,
    nameservers: rec.nameServers?.hostNames ?? [],
    status: whoisStatusList(rec.status),
    registeredAt:
      parseWhoisDate(rec.createdDate) ??
      parseWhoisDate(registry?.createdDate),
    expiresAt:
      parseWhoisDate(rec.expiresDate) ?? parseWhoisDate(registry?.expiresDate),
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
