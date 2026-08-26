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
  const rec = raw.WhoisRecord ?? {};
  const registrar =
    rec.registrarName ?? rec.registryData?.registrarName ?? null;
  const registrantOrg =
    rec.registrant?.organization ?? rec.registrant?.name ?? null;
  const nameservers = rec.nameServers?.hostNames ?? [];
  const status = whoisStatusList(rec.status);
  return {
    host,
    source: "whoisxml",
    registrar,
    registrantOrg,
    nameservers,
    status,
    registeredAt:
      parseWhoisDate(rec.createdDate) ??
      parseWhoisDate(rec.registryData?.createdDate),
    expiresAt:
      parseWhoisDate(rec.expiresDate) ??
      parseWhoisDate(rec.registryData?.expiresDate),
    raw,
  };
}
