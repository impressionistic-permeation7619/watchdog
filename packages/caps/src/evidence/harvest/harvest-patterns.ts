/** Regex catalog ported from legacy-v1 `pipeline/harvest.py` (+ enrich crossplatform). */

export const MAX_PER_TYPE = 40;
export const BTC_MIN_UNIQUE = 8;
export const LTC_MIN_UNIQUE = 8;
export const PHONE_MIN_UNIQUE = 4;

export const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
export const EMAIL_OBFUSCATED_RE =
  /[a-zA-Z0-9._%+-]{2,30}\s*[[(]?\s*(?:at|AT)\s*[\])]?\s*[a-zA-Z0-9.-]{2,30}\s*[[(]?\s*(?:dot|DOT)\s*[\])]?\s*[a-zA-Z]{2,13}\b/g;
export const EMAIL_BRACKET_RE =
  /[a-zA-Z0-9._%+-]{2,30}\s*\[at\]\s*[a-zA-Z0-9.-]{2,30}\s*\[dot\]\s*[a-zA-Z]{2,13}\b/gi;
export const EMAIL_PIPE_RE =
  /[a-zA-Z0-9._%+-]{2,30}\|[a-zA-Z0-9.-]{2,30}\|[a-zA-Z]{2,13}\b/g;

export const URL_RE = /\bhttps?:\/\/[^\s<>"')\]]+/gi;
export const PHONE_RE =
  /\b(?:\+?\d{1,3}[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g;
export const PHONE_INTL_RE =
  /\+\d{1,3}[\s\-.]?\(?\d{1,4}\)?[\s\-.]?\d{2,4}[\s\-.]?\d{2,4}(?:[\s\-.]?\d{1,4})?/g;

export const FEDIVERSE_RE =
  /@([a-zA-Z0-9._-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
export const MATRIX_RE = /@[a-zA-Z0-9._-]+:[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
export const TELEGRAM_RE =
  /(?:https?:\/\/)?(?:www\.)?t\.me\/([a-zA-Z0-9_]{5,32})\b/gi;
export const SESSION_RE = /\b05[0-9a-fA-F]{64}\b/g;
export const BSKY_RE = /\b[a-zA-Z0-9-]+\.bsky\.social\b/g;
export const HANDLE_RE = /(^|[^A-Za-z0-9_])@([A-Za-z0-9_]{2,32})\b/g;
export const PROFILE_HANDLE_RE =
  /\bhttps?:\/\/[^\s/]+\/@([A-Za-z0-9_]{2,32})\b/gi;
/** `@handle (Platform)` vault / forum style. */
export const HANDLE_PAREN_RE = /@([A-Za-z0-9_]{2,32})\s*\(([^)]{1,40})\)/g;

export const BTC_RE =
  /\b(?:bc1[a-zA-HJ-NP-Z0-9]{25,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})\b/g;
export const XMR_RE = /\b[48][0-9AB][1-9A-HJ-NP-Za-km-z]{93}\b/g;
export const ETH_RE = /\b0x[a-fA-F0-9]{40}\b/g;
export const LTC_RE = /\b[LM][a-km-zA-HJ-NP-Z1-9]{26,33}\b/g;

export const ONION_RE = /\b[a-z2-7]{16}\.onion\b|\b[a-z2-7]{56}\.onion\b/gi;
export const I2P_RE = /\b[a-z2-7]{52}\.b32\.i2p\b|\b[a-zA-Z0-9-]+\.i2p\b/gi;
export const TOR_GATEWAY_RE =
  /\b[a-z2-7]{16,56}\.(?:onion\.to|onion\.ly|onion\.link|onion\.ws|tor2web\.org)\b/gi;
export const FREENET_RE =
  /\b(?:SSK|USK|CHK)@[a-zA-Z0-9~-]{43,},[a-zA-Z0-9~-]{43,}/gi;
export const IPFS_RE = /\b(?:Qm[1-9A-HJ-NP-Za-km-z]{44}|bafy[a-z2-7]{55,})\b/g;
export const LOKINET_RE = /\b[a-z0-9]+\.loki\b/gi;

export const IPV4_RE =
  /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g;

export const PGP_RE =
  /\b[0-9A-Fa-f]{4}[\s:]?[0-9A-Fa-f]{4}[\s:]?[0-9A-Fa-f]{4}[\s:]?[0-9A-Fa-f]{4}[\s:]?[0-9A-Fa-f]{4}[\s:]?[0-9A-Fa-f]{4}[\s:]?[0-9A-Fa-f]{4}[\s:]?[0-9A-Fa-f]{4}[\s:]?[0-9A-Fa-f]{4}[\s:]?[0-9A-Fa-f]{4}\b/g;

export const TOX_RE = /\b[0-9A-Fa-f]{76}\b/g;

export const DISCORD_INVITE_RE =
  /(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discord(?:app)?\.com\/invite|discord\.me|dsc\.gg|invite\.gg|disboard\.org\/server)\/([a-zA-Z0-9-]+)/gi;
export const DISCORD_WEBHOOK_RE =
  /https?:\/\/(?:(?:canary|ptb)\.)?discord(?:app)?\.com\/api(?:\/v\d+)?\/webhooks\/(\d+)\/([a-zA-Z0-9_-]+)/gi;
export const DISCORD_LINK_RE =
  /https?:\/\/(?:(?:canary|ptb)\.)?discord(?:app)?\.com\/(?:channels|users)\/(\d+(?:\/\d+)*)/gi;

export const PASTE_RE =
  /(?:https?:\/\/)?(?:pastebin\.com|ghostbin\.(?:com|co)|rentry\.co|hastebin\.com|paste\.ee|dpaste\.org|privatebin\.net|justpaste\.it)\/(?:raw\/)?([a-zA-Z0-9]+)/gi;

export const STEAM_RE =
  /(?:https?:\/\/)?(?:www\.)?steamcommunity\.com\/(?:id|profiles)\/([a-zA-Z0-9_-]+)/gi;

export const SIMPLEX_RE = /\bsimplex:(?:\/+)?[a-zA-Z0-9+/=_-]+\b/gi;

export const MAGNET_RE = /magnet:\?xt=urn:[a-z0-9]+:[a-zA-Z0-9]{32,}/gi;
export const ED2K_RE = /ed2k:\/\/\|file\|[^|\s]+\|/gi;

export const URI_SCHEMES_RE =
  /\b(?:xmpp|bitcoin|bitcoincash|ethereum|monero|matrix|irc|mailto|tel|tox|ssb|ipns|ipfs):[^\s<>"']+/gi;

export const ICQ_RE = /\b(?:ICQ|icq)[:\s#]*(\d{5,9})\b/g;
export const AIM_RE =
  /\b(?:AIM|screen\s*name|s\/n)\s*[:=]\s*([a-zA-Z0-9_]{3,16})\b/gi;
export const YAHOO_MSN_RE =
  /\b(?:YIM|MSN|Yahoo!?\s*(?:ID|IM)|Y!M|Windows Live)\s*[:=]\s*([a-zA-Z0-9._-]{3,30})\b/gi;
export const SKYPE_RE =
  /\b(?:skype|Skype)\s*[:=]\s*([a-zA-Z][a-zA-Z0-9._-]{4,31})\b/g;
export const WICKR_RE =
  /\b(?:wickr|wickr me)\s*[:=]\s*([a-zA-Z0-9_]{3,24})\b/gi;
export const SIGNAL_RE = /\b(?:signal|Signal)\s*[:=]?\s*(\+\d{10,15})\b/g;
export const WIRE_RE = /\b(?:wire|Wire)\s*[:=]\s*@?([a-zA-Z0-9_]{2,21})\b/g;
export const THREEMA_RE = /\b(?:threema|Threema)\s*[:=]\s*([A-Z0-9*]{8})\b/g;
export const KEYBASE_RE =
  /\b(?:keybase|Keybase)\s*[:=]\s*([a-zA-Z0-9_]{2,16})\b/g;
export const JABBER_RE =
  /\b(?:jabber|xmpp|XMPP|Jabber)[:\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/gi;
export const TORCHAT_RE = /\b(?:torchat|TorChat)\s*[:=]?\s*([a-z2-7]{16})\b/gi;
export const RICOCHET_RE = /\bricochet:[a-z2-7]{16}\b/gi;
export const BITMESSAGE_RE =
  /\bBM-[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]{32,36}\b/g;
export const RETROSHARE_RE = /\bretrosha?re:\/\/[^\s<>"']+/gi;
export const IRC_RE =
  /\b(?:irc\.)[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(?:\s*#[a-zA-Z0-9_-]+)?\b/gi;

/** Numbered finding bullets: `1. **claim text**` (line-start or mid-paragraph). */
export const NUMBERED_CLAIM_RE = /\d+[.)]\s+\*\*([^*]+)\*\*/g;

/** Cross-platform self-disclosures (legacy harvest_enrich). */
export const CROSSPLATFORM: {
  re: RegExp;
  kind: "self_link" | "platform_claim" | "handle_on_platform" | "email_self";
}[] = [
  {
    re: /\b(?:my\s+(?:twitter|X|mastodon|blog|website|site|tumblr|youtube|channel|insta(?:gram)?|facebook|FB|flickr|deviantart|reddit|telegram|discord|github)\s+(?:is|:)\s*)(\S+)/gi,
    kind: "self_link",
  },
  {
    re: /\b(?:find\s+me\s+(?:on|at)|I(?:'m|\s+am)\s+(?:also\s+)?(?:on|at))\s+([A-Za-z]+(?:\.[a-z]+)?)\s+(?:as|under|with\s+(?:the\s+)?(?:name|handle|username))\s+([A-Za-z0-9_-]+)/gi,
    kind: "platform_claim",
  },
  {
    re: /\bI(?:'m|\s+am)\s+([A-Za-z0-9_-]+)\s+(?:on|over\s+on|over\s+at)\s+(twitter|X|mastodon|tumblr|youtube|instagram|facebook|flickr|deviantart|reddit|bluesky|telegram|signal|discord|github)/gi,
    kind: "handle_on_platform",
  },
  {
    re: /\b(?:my\s+(?:email|e-mail|mail)\s+(?:is|:)\s*)([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
    kind: "email_self",
  },
  {
    re: /\b(?:my\s+(?:screen\s?name|handle|username|nick)\s+(?:is|:)\s*)([A-Za-z0-9._-]{2,32})/gi,
    kind: "self_link",
  },
  {
    re: /\bI(?:'m|\s+am)\s+also\s+(?:post(?:ing)?|known)\s+as\s+@?([A-Za-z0-9._-]{2,32})/gi,
    kind: "self_link",
  },
  {
    re: /\byou\s+can\s+find\s+me\s+on\s+([A-Za-z]+(?:\.[a-z]+)?)\s+(?:as|under|@)\s+@?([A-Za-z0-9_-]+)/gi,
    kind: "platform_claim",
  },
];

export const NAME_DISCLOSURE_RE =
  /\b(?:my\s+(?:real|legal|actual|full)?\s*name\s+is|i'?m\s+called|they\s+call\s+me)\s+([A-Z][a-z]{1,15}(?:\s+[A-Z][a-z]{1,15}){0,2})\b/g;

/** Payment / storefront handles — anchored, not bare brand words. */
export const PAYMENT_HANDLE_RE =
  /\b(?:my\s+)?(?:paypal|venmo|cashapp|cash\s*app|ko-?fi|patreon)(?:\s+(?:is|:))\s*@?([a-zA-Z0-9._-]{2,32})\b/gi;

export const HAM_CALLSIGN_RE =
  /(?:call\s?sign|my call|ham radio|amateur radio|QRZ|repeater|\b73s?\b)[^.\n]{0,60}\b([AKNW][A-Z]?\d[A-Z]{1,3})\b/gi;

export const FAA_N_NUMBER_RE =
  /(?:tail number|N-?number|my plane)[^.\n]{0,30}\b(N\d{1,5}[A-Z]{0,2})\b/gi;

export const PROFESSIONAL_LICENCE_RE =
  /(?:licensed|certified|registered)\s+(?:\w+\s+){0,3}(?:nurse|teacher|therapist|counsellor|counselor|electrician|plumber|pilot|driver|instructor|social worker|paramedic|emt|realtor|barber|contractor)\b/gi;

/** Prefix immediately before a match — skip hypothetical / negated self-disclosure. */
export function isNegatedOrConditionalPrefix(prefix: string): boolean {
  const tail = prefix.slice(-80);
  if (/\bif\b[\s\S]{0,60}$/i.test(tail)) return true;
  if (
    /\b(never|not|no|didn'?t|did not|haven'?t|won'?t)\b[\s\S]{0,40}$/i.test(
      tail
    )
  ) {
    return true;
  }
  return false;
}

/** `matchAll` skipping hits whose prefix is negated / conditional. */
export function matchAllUnlessNegated(
  text: string,
  re: RegExp
): RegExpExecArray[] {
  re.lastIndex = 0;
  const hits: RegExpExecArray[] = [];
  for (const m of text.matchAll(re)) {
    const idx = m.index ?? 0;
    if (isNegatedOrConditionalPrefix(text.slice(0, idx))) continue;
    hits.push(m);
  }
  return hits;
}

// oxlint-disable-next-line eslint/no-misleading-character-class -- matches any one of several invisible chars (incl. ZWJ) to strip, not a joined grapheme
export const ZERO_WIDTH = /[\u200B\u200C\u200D\u2060\uFEFF\u00AD]/g;

export const JUNK_EMAIL_DOMAINS = [
  "example.com",
  "example.org",
  "example.net",
  "test.com",
  "localhost",
  "email.com",
  "domain.com",
  "sentry.io",
];
export const JUNK_EMAIL_PREFIXES = ["noreply@", "no-reply@", "mailer-daemon@"];

export const LEET_SINGLE: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "8": "b",
  "9": "g",
  $: "s",
  "!": "i",
};

export const AIM_JUNK = new Set([
  "screen",
  "name",
  "user",
  "username",
  "handle",
  "here",
  "me",
]);
