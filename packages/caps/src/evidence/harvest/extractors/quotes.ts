import { pushClaim, pushQuestion } from "../harvest-helpers";
import type { HarvestExtractor } from "./types";

const quotesExtractor: HarvestExtractor = {
  id: "quotes",
  collect(ctx) {
    if (!ctx.quotedAuthor) return;
    pushClaim(
      ctx.claims,
      ctx.seen,
      `Quoted text attributed to ${ctx.quotedAuthor}`,
      ctx.sourceText,
      ctx.quotedAuthor
    );
    pushQuestion(
      ctx.questions,
      ctx.seen,
      `Re-attribute quoted text to ${ctx.quotedAuthor}?`,
      ctx.sourceText,
      ctx.quotedAuthor
    );
  },
};

export { quotesExtractor };
