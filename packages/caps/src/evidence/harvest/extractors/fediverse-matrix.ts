import { pushId } from "../harvest-helpers";
import * as P from "../harvest-patterns";
import type { HarvestExtractor } from "./types";

const fediverseExtractor: HarvestExtractor = {
  id: "fediverse",
  collect(ctx) {
    for (const m of ctx.cleaned.matchAll(P.FEDIVERSE_RE)) {
      const user = m[1];
      const instance = m[2];
      if (!user || !instance) continue;
      ctx.fediSkip.add(`${user.toLowerCase()}@${instance.toLowerCase()}`);
      pushId(
        ctx.identifiers,
        ctx.seen,
        "handle",
        `@${user}@${instance}`.toLowerCase(),
        ctx.sourceText,
        { platform: "mastodon", quoteNeedle: m[0] }
      );
    }
  },
};

const matrixExtractor: HarvestExtractor = {
  id: "matrix",
  collect(ctx) {
    for (const m of ctx.cleaned.matchAll(P.MATRIX_RE)) {
      pushId(
        ctx.identifiers,
        ctx.seen,
        "handle",
        (m[0] ?? "").toLowerCase(),
        ctx.sourceText,
        {
          platform: "matrix",
          quoteNeedle: m[0],
        }
      );
    }
  },
};

export { fediverseExtractor, matrixExtractor };
