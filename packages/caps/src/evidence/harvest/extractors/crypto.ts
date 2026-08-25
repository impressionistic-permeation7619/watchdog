import { pushId, validBtc, validLtc } from "../harvest-helpers";
import * as P from "../harvest-patterns";
import type { HarvestExtractor } from "./types";

const cryptoExtractor: HarvestExtractor = {
  id: "crypto",
  collect(ctx) {
    for (const m of ctx.cleaned.matchAll(P.BTC_RE)) {
      const addr = m[0] ?? "";
      if (!validBtc(addr)) continue;
      pushId(ctx.identifiers, ctx.seen, "crypto", addr, ctx.sourceText, {
        platform: "bitcoin",
        notes: "btc",
      });
    }
    for (const m of ctx.cleaned.matchAll(P.XMR_RE)) {
      pushId(ctx.identifiers, ctx.seen, "crypto", m[0] ?? "", ctx.sourceText, {
        platform: "monero",
        notes: "xmr",
      });
    }
    for (const m of ctx.cleaned.matchAll(P.ETH_RE)) {
      pushId(
        ctx.identifiers,
        ctx.seen,
        "crypto",
        (m[0] ?? "").toLowerCase(),
        ctx.sourceText,
        {
          platform: "ethereum",
          notes: "eth",
        }
      );
    }
    for (const m of ctx.cleaned.matchAll(P.LTC_RE)) {
      const addr = m[0] ?? "";
      if (!validLtc(addr)) continue;
      pushId(ctx.identifiers, ctx.seen, "crypto", addr, ctx.sourceText, {
        notes: "ltc",
      });
    }
  },
};

export { cryptoExtractor };
