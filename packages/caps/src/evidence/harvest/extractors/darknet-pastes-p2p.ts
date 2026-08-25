import { pushId } from "../harvest-helpers";
import * as P from "../harvest-patterns";
import type { HarvestExtractor } from "./types";

const darknetExtractor: HarvestExtractor = {
  id: "darknet",
  collect(ctx) {
    for (const m of ctx.cleaned.matchAll(P.ONION_RE)) {
      pushId(
        ctx.identifiers,
        ctx.seen,
        "url",
        (m[0] ?? "").toLowerCase(),
        ctx.sourceText,
        { notes: "onion" }
      );
    }
    for (const m of ctx.cleaned.matchAll(P.I2P_RE)) {
      pushId(
        ctx.identifiers,
        ctx.seen,
        "url",
        (m[0] ?? "").toLowerCase(),
        ctx.sourceText,
        { notes: "i2p" }
      );
    }
    for (const m of ctx.cleaned.matchAll(P.TOR_GATEWAY_RE)) {
      pushId(
        ctx.identifiers,
        ctx.seen,
        "url",
        (m[0] ?? "").toLowerCase(),
        ctx.sourceText,
        { notes: "tor_gateway" }
      );
    }
    for (const m of ctx.cleaned.matchAll(P.FREENET_RE)) {
      pushId(ctx.identifiers, ctx.seen, "other", m[0] ?? "", ctx.sourceText, {
        notes: "freenet",
      });
    }
    for (const m of ctx.cleaned.matchAll(P.IPFS_RE)) {
      pushId(ctx.identifiers, ctx.seen, "other", m[0] ?? "", ctx.sourceText, {
        notes: "ipfs",
      });
    }
    for (const m of ctx.cleaned.matchAll(P.LOKINET_RE)) {
      pushId(
        ctx.identifiers,
        ctx.seen,
        "url",
        (m[0] ?? "").toLowerCase(),
        ctx.sourceText,
        { notes: "lokinet" }
      );
    }
  },
};

/** Pastebin-class hosts. */

const pastesExtractor: HarvestExtractor = {
  id: "pastes",
  collect(ctx) {
    for (const m of ctx.cleaned.matchAll(P.PASTE_RE)) {
      const raw = m[0] ?? "";
      const url = raw.startsWith("http") ? raw : `https://${raw}`;
      pushId(ctx.identifiers, ctx.seen, "url", url, ctx.sourceText, {
        notes: "paste",
      });
    }
  },
};

/** Magnet / ed2k file-sharing URIs. */

const p2pExtractor: HarvestExtractor = {
  id: "p2p",
  collect(ctx) {
    for (const m of ctx.cleaned.matchAll(P.MAGNET_RE)) {
      pushId(ctx.identifiers, ctx.seen, "url", m[0] ?? "", ctx.sourceText, {
        notes: "magnet",
      });
    }
    for (const m of ctx.cleaned.matchAll(P.ED2K_RE)) {
      pushId(ctx.identifiers, ctx.seen, "url", m[0] ?? "", ctx.sourceText, {
        notes: "ed2k",
      });
    }
  },
};

/** mailto / bitcoin / tel / other scheme URIs. */

export { darknetExtractor, pastesExtractor, p2pExtractor };
