import { fetchHashlookup } from "@watchdog/tools";

import { defineCollectCap } from "../../lib/collect/define-collect-cap";
import { hashlookupLookupInput } from "./input";
import { interpretHashlookupLookupReport } from "./interpret";
import { hashlookupSnapshotSchema } from "./report-schema";

const UA = "Watchdog/1.0 (+threat.hashlookup.lookup; OSINT)";

export const hashlookupLookup = defineCollectCap({
  id: "threat.hashlookup.lookup",
  version: "1",
  title: "CIRCL hashlookup",
  description:
    "Known-file corpus check (NSRL-derived). A hit means “seen as known software,” not a malware verdict.",
  dataSource: "hashlookup.circl.lu",
  input: hashlookupLookupInput,
  timeoutMs: 30_000,
  kind: "collect",
  flags: ["third_party"],
  useCases: ["Passive", "Footprint"],
  egress: "third_party",
  consumes: [{ kind: "hash" }],
  produces: [{ kind: "evidence", evidenceKind: "file" }],
  jobPolicy: {
    cacheTtlMs: 60 * 60_000,
  },
  schema: hashlookupSnapshotSchema,
  reportLabel: "hashlookup.lookup",
  async fetch(ctx) {
    const hash = ctx.input.hash.trim();
    ctx.log(`CIRCL hashlookup ${hash}`);
    const snap = await fetchHashlookup(hash, ctx.signal, { userAgent: UA });
    ctx.log(`found=${snap.found} algo=${snap.algo}`);
    return { snap, artifactName: `hashlookup-${snap.hash}.json` };
  },
  interpretSnap: interpretHashlookupLookupReport,
});
