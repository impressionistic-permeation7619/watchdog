import { pushId } from "../harvest-helpers";
import * as P from "../harvest-patterns";
import type { HarvestExtractor } from "./types";

const modernMessengersExtractor: HarvestExtractor = {
  id: "modern_messengers",
  collect(ctx) {
    for (const m of ctx.cleaned.matchAll(P.TELEGRAM_RE)) {
      const user = m[1];
      if (!user) continue;
      pushId(ctx.identifiers, ctx.seen, "handle", `@${user}`, ctx.sourceText, {
        platform: "telegram",
        quoteNeedle: m[0],
      });
    }
    for (const m of ctx.cleaned.matchAll(P.BSKY_RE)) {
      pushId(
        ctx.identifiers,
        ctx.seen,
        "handle",
        (m[0] ?? "").toLowerCase(),
        ctx.sourceText,
        { platform: "bluesky" }
      );
    }
    for (const m of ctx.cleaned.matchAll(P.SESSION_RE)) {
      pushId(ctx.identifiers, ctx.seen, "handle", m[0] ?? "", ctx.sourceText, {
        platform: "session",
      });
    }
    for (const m of ctx.cleaned.matchAll(P.DISCORD_INVITE_RE)) {
      const code = m[1];
      if (!code) continue;
      pushId(
        ctx.identifiers,
        ctx.seen,
        "url",
        `https://discord.gg/${code}`,
        ctx.sourceText,
        {
          platform: "discord",
          notes: "invite",
          quoteNeedle: m[0],
        }
      );
    }
    for (const m of ctx.cleaned.matchAll(P.DISCORD_WEBHOOK_RE)) {
      pushId(ctx.identifiers, ctx.seen, "url", m[0] ?? "", ctx.sourceText, {
        platform: "discord",
        notes: "webhook",
      });
    }
    for (const m of ctx.cleaned.matchAll(P.DISCORD_LINK_RE)) {
      pushId(ctx.identifiers, ctx.seen, "url", m[0] ?? "", ctx.sourceText, {
        platform: "discord",
        notes: "link",
      });
    }
    for (const m of ctx.cleaned.matchAll(P.STEAM_RE)) {
      const id = m[1];
      if (!id) continue;
      pushId(ctx.identifiers, ctx.seen, "handle", id, ctx.sourceText, {
        platform: "steam",
        quoteNeedle: m[0],
      });
    }
    for (const m of ctx.cleaned.matchAll(P.SIMPLEX_RE)) {
      pushId(ctx.identifiers, ctx.seen, "other", m[0] ?? "", ctx.sourceText, {
        notes: "simplex",
      });
    }
  },
};

export { modernMessengersExtractor };
