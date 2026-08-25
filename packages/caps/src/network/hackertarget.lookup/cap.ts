import { fetchHackertargetReverseIp, normalizeIp } from "@watchdog/tools";

import { defineCollectCap } from "../../lib/collect/define-collect-cap";
import { hackertargetLookupInput } from "./input";
import { interpretHackertargetLookupReport } from "./interpret";
import { hackertargetLookupSnapshotSchema } from "./report-schema";

const UA = "Watchdog/1.0 (+network.hackertarget.lookup; OSINT)";

export const hackertargetLookup = defineCollectCap({
  id: "network.hackertarget.lookup",
  version: "1",
  title: "HackerTarget reverse IP",
  description:
    "Reverse-IP co-hostnames for an IP — cheap shared-hosting / neighbor discovery.",
  dataSource: "api.hackertarget.com/reverseiplookup",
  input: hackertargetLookupInput,
  timeoutMs: 45_000,
  kind: "collect",
  useCases: ["Passive", "Footprint"],
  consumes: [{ kind: "ip" }],
  produces: [
    { kind: "evidence", evidenceKind: "file" },
    { kind: "identifier", type: "domain" },
  ],
  jobPolicy: {
    cacheTtlMs: 60 * 60_000,
  },
  schema: hackertargetLookupSnapshotSchema,
  reportLabel: "hackertarget.lookup",
  async fetch(ctx) {
    const ip = normalizeIp(ctx.input.ip);
    ctx.log(`HackerTarget reverse-IP ${ip}`);
    const snap = await fetchHackertargetReverseIp(ip, ctx.signal, {
      userAgent: UA,
    });
    ctx.log(
      `domains=${snap.domains.length}${snap.error ? ` error=${snap.error}` : ""}`
    );
    return {
      snap,
      artifactName: `hackertarget-${ip.replaceAll(":", "-")}.json`,
    };
  },
  interpretSnap: interpretHackertargetLookupReport,
});
