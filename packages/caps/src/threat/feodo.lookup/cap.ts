import { fetchFeodoLookup, normalizeIp } from "@watchdog/tools";

import { defineCollectCap } from "../../lib/collect/define-collect-cap";
import { feodoLookupInput } from "./input";
import { interpretFeodoLookupReport } from "./interpret";
import { feodoLookupSnapshotSchema } from "./report-schema";

const UA = "Watchdog/1.0 (+threat.feodo.lookup; OSINT)";

export const feodoLookup = defineCollectCap({
  id: "threat.feodo.lookup",
  version: "1",
  title: "Feodo Tracker lookup",
  description:
    "Whether an IP is on Feodo Tracker’s recommended botnet C2 blocklist (Emotet/Dridex/QakBot-class). Membership only.",
  dataSource: "feodotracker.abuse.ch",
  input: feodoLookupInput,
  timeoutMs: 30_000,
  kind: "collect",
  flags: ["third_party"],
  useCases: ["Passive", "Footprint"],
  egress: "third_party",
  credentials: [{ name: "THREATFOX_API_KEY", optional: true }],
  consumes: [{ kind: "ip" }],
  produces: [{ kind: "evidence", evidenceKind: "file" }],
  jobPolicy: {
    cacheTtlMs: 60 * 60_000,
  },
  schema: feodoLookupSnapshotSchema,
  reportLabel: "feodo.lookup",
  async fetch(ctx) {
    const ip = normalizeIp(ctx.input.ip);
    ctx.log(`Feodo Tracker ${ip}`);
    const apiKey = (await ctx.hasCredential("THREATFOX_API_KEY"))
      ? await ctx.getCredential("THREATFOX_API_KEY")
      : undefined;
    const snap = await fetchFeodoLookup(ip, ctx.signal, {
      userAgent: UA,
      apiKey,
    });
    ctx.log(`found=${snap.found} malware=${snap.malware ?? "?"}`);
    return { snap, artifactName: `feodo-${ip.replaceAll(":", "-")}.json` };
  },
  interpretSnap: interpretFeodoLookupReport,
});
