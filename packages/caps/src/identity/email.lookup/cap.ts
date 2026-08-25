import { fetchEmailLookup } from "@watchdog/tools";

import { defineCollectCap } from "../../lib/collect/define-collect-cap";
import { emailLookupInput } from "./input";
import { interpretEmailLookupReport } from "./interpret";
import { emailLookupSnapshotSchema } from "./report-schema";

export const emailLookup = defineCollectCap({
  id: "identity.email.lookup",
  version: "1",
  title: "Email lookup",
  description:
    "Email-seed pivot: mailbox-domain MX, SPF/DMARC presence, and provider hint. Lighter than full Mail config; seeds domain Identifiers from the address.",
  dataSource: "system resolver",
  input: emailLookupInput,
  timeoutMs: 30_000,
  kind: "collect",
  useCases: ["Passive", "Footprint"],
  consumes: [{ kind: "identifier", type: "email" }],
  produces: [{ kind: "evidence", evidenceKind: "file" }],
  jobPolicy: {
    cacheTtlMs: 30 * 60_000,
  },
  schema: emailLookupSnapshotSchema,
  reportLabel: "email.lookup",
  async fetch(ctx) {
    const email = ctx.input.email.trim();
    ctx.log(`email lookup ${email}`);
    const snap = await fetchEmailLookup(email, ctx.signal);
    ctx.log(
      `domain=${snap.domain} provider=${snap.providerHint ?? "?"} MX=${snap.mx.length}`
    );
    return { snap, artifactName: `email-lookup.json` };
  },
  interpretSnap: interpretEmailLookupReport,
});
