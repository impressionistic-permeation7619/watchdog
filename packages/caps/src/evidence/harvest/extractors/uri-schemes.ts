import { isJunkEmail, pushId } from "../harvest-helpers";
import * as P from "../harvest-patterns";
import type { HarvestExtractor } from "./types";

const uriSchemesExtractor: HarvestExtractor = {
  id: "uri_schemes",
  collect(ctx) {
    for (const m of ctx.cleaned.matchAll(P.URI_SCHEMES_RE)) {
      const raw = (m[0] ?? "").replace(/[.,;:!?)]+$/, "");
      const scheme = raw.split(":")[0]?.toLowerCase() ?? "";
      if (scheme === "mailto") {
        const email = raw.slice("mailto:".length).split("?")[0]?.toLowerCase();
        if (email && !isJunkEmail(email)) {
          pushId(ctx.identifiers, ctx.seen, "email", email, ctx.sourceText, {
            quoteNeedle: raw,
          });
        }
      } else if (scheme === "bitcoin" || scheme === "bitcoincash") {
        pushId(ctx.identifiers, ctx.seen, "crypto", raw, ctx.sourceText, {
          platform: "bitcoin",
          notes: scheme,
        });
      } else if (scheme === "ethereum") {
        pushId(ctx.identifiers, ctx.seen, "crypto", raw, ctx.sourceText, {
          platform: "ethereum",
        });
      } else if (scheme === "monero") {
        pushId(ctx.identifiers, ctx.seen, "crypto", raw, ctx.sourceText, {
          platform: "monero",
        });
      } else if (scheme === "tel") {
        pushId(
          ctx.identifiers,
          ctx.seen,
          "phone",
          raw.slice(4),
          ctx.sourceText,
          {
            quoteNeedle: raw,
          }
        );
      } else {
        pushId(ctx.identifiers, ctx.seen, "url", raw, ctx.sourceText, {
          notes: `uri_${scheme}`,
        });
      }
    }
  },
};

/** Telegram / Bluesky / Session / Discord / Steam / SimpleX. */

export { uriSchemesExtractor };
