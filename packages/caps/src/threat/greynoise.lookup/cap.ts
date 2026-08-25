import { fetchGreynoiseCommunity, normalizeIp } from "@watchdog/tools";

import { defineCollectCap } from "../../lib/collect/define-collect-cap";
import { greynoiseLookupInput } from "./input";
import { interpretGreynoiseLookupReport } from "./interpret";
import { greynoiseLookupSnapshotSchema } from "./report-schema";

const UA = "Watchdog/1.0 (+threat.greynoise.lookup; OSINT)";

export const greynoiseLookup = defineCollectCap({
  id: "threat.greynoise.lookup",
  version: "1",
  title: "GreyNoise Community",
  description:
    "Whether an IP is internet background noise and/or a known benign service (RIOT). Helps filter scanner chatter from targeted traffic.",
  dataSource: "api.greynoise.io/v3/community",
  input: greynoiseLookupInput,
  timeoutMs: 30_000,
  kind: "collect",
  flags: ["third_party"],
  useCases: ["Passive", "Footprint"],
  egress: "third_party",
  credentials: [{ name: "GREYNOISE_API_KEY", optional: true }],
  consumes: [{ kind: "ip" }],
  produces: [{ kind: "evidence", evidenceKind: "file" }],
  jobPolicy: {
    cacheTtlMs: 30 * 60_000,
  },
  schema: greynoiseLookupSnapshotSchema,
  reportLabel: "greynoise.lookup",
  async fetch(ctx) {
    const ip = normalizeIp(ctx.input.ip);
    ctx.log(`GreyNoise Community ${ip}`);
    const apiKey = (await ctx.hasCredential("GREYNOISE_API_KEY"))
      ? await ctx.getCredential("GREYNOISE_API_KEY")
      : undefined;
    const snap = await fetchGreynoiseCommunity(ip, ctx.signal, {
      userAgent: UA,
      apiKey,
    });
    ctx.log(
      `noise=${snap.noise ?? "?"} riot=${snap.riot ?? "?"} class=${snap.classification ?? "?"}`
    );
    return { snap, artifactName: `greynoise-${ip.replaceAll(":", "-")}.json` };
  },
  interpretSnap: interpretGreynoiseLookupReport,
});
