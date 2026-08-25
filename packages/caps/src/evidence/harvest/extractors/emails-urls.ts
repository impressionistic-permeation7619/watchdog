import { describeFilenameForensics } from "../../lib/filename-forensics";
import {
  collectEmails,
  normalizeLeetForEmails,
  pushClaim,
  pushId,
} from "../harvest-helpers";
import * as P from "../harvest-patterns";
import type { HarvestExtractor } from "./types";

const emailsExtractor: HarvestExtractor = {
  id: "emails",
  collect(ctx) {
    collectEmails(
      ctx.cleaned,
      ctx.identifiers,
      ctx.seen,
      ctx.sourceText,
      ctx.fediSkip
    );
    const leetText = normalizeLeetForEmails(ctx.cleaned);
    if (leetText !== ctx.cleaned) {
      collectEmails(
        leetText,
        ctx.identifiers,
        ctx.seen,
        ctx.sourceText,
        ctx.fediSkip
      );
    }
  },
};

/** Plain http(s) URLs + filename forensics on those URLs. */

const urlsExtractor: HarvestExtractor = {
  id: "urls",
  collect(ctx) {
    for (const url of [...(ctx.cleaned.match(P.URL_RE) ?? [])].map((u) =>
      u.replace(/[.,;:]+$/, "")
    )) {
      pushId(ctx.identifiers, ctx.seen, "url", url, ctx.sourceText);
      const hit = describeFilenameForensics(url);
      if (!hit) continue;
      pushClaim(
        ctx.claims,
        ctx.seen,
        `Filename forensics (${hit.label}): ${hit.detail}`,
        ctx.sourceText,
        url
      );
    }
  },
};

export { emailsExtractor, urlsExtractor };
