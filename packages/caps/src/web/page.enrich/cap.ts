import { fetchPageEnrich } from "@watchdog/tools";

import { defineCollectCap } from "../../lib/collect/define-collect-cap";
import { pageEnrichInput } from "./input";
import { interpretPageEnrichReport } from "./interpret";
import { pageEnrichSnapshotSchema } from "./report-schema";

const UA = "Watchdog/1.0 (+web.page.enrich; OSINT)";

export const pageEnrich = defineCollectCap({
  id: "web.page.enrich",
  version: "1",
  title: "Page enrich",
  description:
    "Live HTML title, social/meta tags, and common tracker script hints — what the page claims about itself right now.",
  dataSource: "live HTML",
  input: pageEnrichInput,
  timeoutMs: 45_000,
  kind: "collect",
  flags: ["invasive"],
  useCases: ["Active"],
  consumes: [{ kind: "url" }],
  produces: [{ kind: "evidence", evidenceKind: "file" }],
  jobPolicy: {
    cacheTtlMs: 15 * 60_000,
  },
  schema: pageEnrichSnapshotSchema,
  reportLabel: "page.enrich",
  async fetch(ctx) {
    const url = ctx.input.url.trim();
    ctx.log(`page enrich ${url}`);
    const snap = await fetchPageEnrich(url, ctx.signal, { userAgent: UA });
    if (!snap.ok) {
      throw new Error(snap.error ?? `Page enrich HTTP ${snap.status}`);
    }
    ctx.log(
      `title=${snap.title ?? "?"} trackers=${snap.trackers.map((t) => t.vendor).join(",") || "none"}`
    );
    return { snap, artifactName: "page-enrich.json" };
  },
  interpretSnap: interpretPageEnrichReport,
});
