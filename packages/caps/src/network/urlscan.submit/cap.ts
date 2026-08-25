import { submitUrlscan } from "@watchdog/tools";

import { defineCollectCap } from "../../lib/collect/define-collect-cap";
import { urlscanSubmitInput } from "./input";
import { interpretUrlscanSubmitReport } from "./interpret";
import { urlscanSubmitSnapshotSchema } from "./report-schema";

const UA = "Watchdog/1.0 (+network.urlscan.submit; OSINT)";

export const urlscanSubmit = defineCollectCap({
  id: "network.urlscan.submit",
  version: "1",
  title: "URLScan submit",
  description:
    "Submit a URL for a live urlscan.io browser scan. Default visibility is unlisted — public scans can leak investigation interest.",
  dataSource: "urlscan.io/api/v1/scan",
  input: urlscanSubmitInput,
  timeoutMs: 30_000,
  kind: "act",
  flags: ["needs_key", "third_party", "invasive"],
  useCases: ["Active"],
  egress: "third_party",
  credentials: [{ name: "URLSCAN_API_KEY" }],
  consumes: [{ kind: "url" }],
  produces: [{ kind: "evidence", evidenceKind: "file" }],
  schema: urlscanSubmitSnapshotSchema,
  reportLabel: "urlscan.submit",
  async fetch(ctx) {
    const url = ctx.input.url.trim();
    const visibility = ctx.input.visibility ?? "unlisted";
    ctx.log(`urlscan.io submit ${url} visibility=${visibility}`);
    const key = await ctx.getCredential("URLSCAN_API_KEY");
    const snap = await submitUrlscan(url, key, visibility, ctx.signal, {
      userAgent: UA,
    });
    ctx.log(`accepted=${snap.accepted} uuid=${snap.uuid ?? "none"}`);
    return { snap, artifactName: "urlscan-submit.json" };
  },
  interpretSnap: interpretUrlscanSubmitReport,
});
