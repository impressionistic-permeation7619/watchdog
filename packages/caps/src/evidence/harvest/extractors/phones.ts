import { pushId } from "../harvest-helpers";
import * as P from "../harvest-patterns";
import type { HarvestExtractor } from "./types";

const phonesExtractor: HarvestExtractor = {
  id: "phones",
  collect(ctx) {
    for (const phone of ctx.cleaned.matchAll(P.PHONE_RE)) {
      const raw = phone[0] ?? "";
      const digits = raw.replaceAll(/\D/g, "");
      if (digits.length < 7 || new Set(digits).size < P.PHONE_MIN_UNIQUE)
        continue;
      pushId(ctx.identifiers, ctx.seen, "phone", raw, ctx.sourceText);
    }
    for (const m of ctx.cleaned.matchAll(P.PHONE_INTL_RE)) {
      const raw = m[0] ?? "";
      if (raw.includes(".")) continue;
      const digits = raw.replaceAll(/\D/g, "");
      if (digits.length < 7 || digits.length > 15) continue;
      if (new Set(digits).size < P.PHONE_MIN_UNIQUE) continue;
      pushId(
        ctx.identifiers,
        ctx.seen,
        "phone",
        raw.replaceAll(/[\s\-().]/g, ""),
        ctx.sourceText,
        {
          quoteNeedle: raw,
        }
      );
    }
  },
};

export { phonesExtractor };
