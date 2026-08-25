import { isJunkEmail, labeledHandle, pushId } from "../harvest-helpers";
import * as P from "../harvest-patterns";
import type { HarvestExtractor } from "./types";

const historicalMessengersExtractor: HarvestExtractor = {
  id: "historical_messengers",
  collect(ctx) {
    labeledHandle(ctx.identifiers, ctx.seen, ctx.cleaned, P.ICQ_RE, "icq", {
      lowercase: false,
    });
    for (const m of ctx.cleaned.matchAll(P.AIM_RE)) {
      const h = (m[1] ?? "").trim();
      if (h.length < 3 || /^\d+$/.test(h) || P.AIM_JUNK.has(h.toLowerCase())) {
        continue;
      }
      pushId(
        ctx.identifiers,
        ctx.seen,
        "handle",
        h.toLowerCase(),
        ctx.sourceText,
        {
          notes: "aim",
          quoteNeedle: m[0],
        }
      );
    }
    labeledHandle(
      ctx.identifiers,
      ctx.seen,
      ctx.cleaned,
      P.YAHOO_MSN_RE,
      "other",
      {
        notes: "yahoo_msn",
      }
    );
    labeledHandle(ctx.identifiers, ctx.seen, ctx.cleaned, P.SKYPE_RE, "skype");
    labeledHandle(ctx.identifiers, ctx.seen, ctx.cleaned, P.WICKR_RE, "wickr");
    labeledHandle(
      ctx.identifiers,
      ctx.seen,
      ctx.cleaned,
      P.SIGNAL_RE,
      "signal",
      {
        asPhone: true,
      }
    );
    labeledHandle(ctx.identifiers, ctx.seen, ctx.cleaned, P.WIRE_RE, "wire");
    labeledHandle(
      ctx.identifiers,
      ctx.seen,
      ctx.cleaned,
      P.THREEMA_RE,
      "other",
      {
        lowercase: false,
        notes: "threema",
      }
    );
    labeledHandle(
      ctx.identifiers,
      ctx.seen,
      ctx.cleaned,
      P.KEYBASE_RE,
      "keybase"
    );
    for (const m of ctx.cleaned.matchAll(P.JABBER_RE)) {
      const jid = (m[1] ?? "").toLowerCase();
      if (!jid || isJunkEmail(jid)) continue;
      pushId(ctx.identifiers, ctx.seen, "handle", jid, ctx.sourceText, {
        notes: "xmpp",
        quoteNeedle: m[0],
      });
    }
    for (const m of ctx.cleaned.matchAll(P.TORCHAT_RE)) {
      pushId(
        ctx.identifiers,
        ctx.seen,
        "other",
        (m[1] ?? "").toLowerCase(),
        ctx.sourceText,
        {
          notes: "torchat",
          quoteNeedle: m[0],
        }
      );
    }
    for (const m of ctx.cleaned.matchAll(P.RICOCHET_RE)) {
      pushId(
        ctx.identifiers,
        ctx.seen,
        "other",
        (m[0] ?? "").toLowerCase(),
        ctx.sourceText,
        {
          notes: "ricochet",
        }
      );
    }
    for (const m of ctx.cleaned.matchAll(P.BITMESSAGE_RE)) {
      pushId(ctx.identifiers, ctx.seen, "other", m[0] ?? "", ctx.sourceText, {
        notes: "bitmessage",
      });
    }
    for (const m of ctx.cleaned.matchAll(P.RETROSHARE_RE)) {
      pushId(ctx.identifiers, ctx.seen, "url", m[0] ?? "", ctx.sourceText, {
        notes: "retroshare",
      });
    }
    for (const m of ctx.cleaned.matchAll(P.IRC_RE)) {
      pushId(
        ctx.identifiers,
        ctx.seen,
        "other",
        (m[0] ?? "").toLowerCase(),
        ctx.sourceText,
        {
          notes: "irc",
        }
      );
    }
  },
};

export { historicalMessengersExtractor };
