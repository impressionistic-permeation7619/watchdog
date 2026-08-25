import type { PlaybookDef } from "./plan";

export const hostFootprint: PlaybookDef = {
  id: "host-footprint",
  title: "Domain and DNS footprint",
  description:
    "Passive DNS, WHOIS, mail config, then Certificate Transparency for a hostname. Same-seed; each step waits for the previous Job.",
  seedKinds: ["host"],
  steps: [
    "network.dns.lookup",
    "network.whois.lookup",
    "network.domain.mail_config",
    "network.ct.lookup",
    "network.certspotter.lookup",
  ],
};

export const hostPosture: PlaybookDef = {
  id: "host-posture",
  title: "Host TLS and HTTP posture",
  description:
    "Invasive TLS handshake then HTTP surface probe. Separate from the default footprint run.",
  seedKinds: ["host"],
  steps: ["network.host.tls_audit", "network.host.http_probe"],
};

export const hostReputation: PlaybookDef = {
  id: "host-reputation",
  title: "Host public reputation",
  description:
    "urlscan search plus Tranco rank for a hostname. Public catalog only — no VirusTotal pile-on.",
  seedKinds: ["host"],
  steps: ["network.urlscan.lookup", "network.tranco.lookup"],
};

export const urlCapture: PlaybookDef = {
  id: "url-capture",
  title: "Capture URL and harvest identifiers",
  description:
    "Enrich a URL dump, then harvest identifiers from the same seed Evidence after enrich succeeds (timing only — harvest keeps the seed Evidence id).",
  seedKinds: ["url", "evidence"],
  steps: ["network.url.enrich", "evidence.harvest"],
};

export const urlCaptureAi: PlaybookDef = {
  id: "url-capture-ai",
  title: "Capture URL and extract with AI",
  description:
    "Enrich a URL dump, then LLM-extract identifiers/claims from the same seed. Separate from harvest — never combined.",
  seedKinds: ["url", "evidence"],
  steps: ["network.url.enrich", "evidence.extract.ai"],
};

export const urlHistory: PlaybookDef = {
  id: "url-history",
  title: "URL archive history",
  description:
    "Wayback CDX for the URL (limit pinned), then Common Crawl for the derived host. Does not fetch snapshots.",
  seedKinds: ["url"],
  steps: [
    { capabilityId: "archive.wayback.lookup", input: { limit: 25 } },
    "archive.commoncrawl.lookup",
  ],
};

export const urlReputation: PlaybookDef = {
  id: "url-reputation",
  title: "URL public lookups",
  description:
    "urlscan search (host derived from the URL) then unshorten. Keyed threat lists live in url-reputation-plus.",
  seedKinds: ["url"],
  steps: ["network.urlscan.lookup", "web.url.unshorten"],
};

export const urlReputationPlus: PlaybookDef = {
  id: "url-reputation-plus",
  title: "URL keyed threat reputation",
  description:
    "URLhaus then Google Safe Browsing. Greys without ThreatFox / Safe Browsing vault slots.",
  seedKinds: ["url"],
  steps: ["threat.urlhaus.lookup", "threat.safebrowsing.lookup"],
};

export const ipContext: PlaybookDef = {
  id: "ip-context",
  title: "IP context",
  description:
    "Public IP geo/ASN, ipctl, then reverse DNS. ipinfo stays in a keyed sibling, not this book.",
  seedKinds: ["ip"],
  steps: ["network.ip.lookup", "network.ipctl.lookup", "network.dns.reverse"],
};

export const ipReputation: PlaybookDef = {
  id: "ip-reputation",
  title: "IP public blocklists",
  description:
    "DShield then FireHOL public lists. AbuseIPDB is keyed and stays out.",
  seedKinds: ["ip"],
  steps: ["threat.dshield.lookup", "threat.firehol.lookup"],
};

export const ipExposure: PlaybookDef = {
  id: "ip-exposure",
  title: "IP keyed exposure",
  description:
    "Shodan, Censys, then LeakIX. All keyed — the book greys as a set without vault slots.",
  seedKinds: ["ip"],
  steps: [
    "network.shodan.lookup",
    "network.censys.lookup",
    "network.leakix.lookup",
  ],
};

export const ipNoise: PlaybookDef = {
  id: "ip-noise",
  title: "IP background noise",
  description:
    "Tor exit list then GreyNoise — scanner/noise context for an IP.",
  seedKinds: ["ip"],
  steps: ["network.tor_exit.lookup", "threat.greynoise.lookup"],
};

export const emailIdentity: PlaybookDef = {
  id: "email-identity",
  title: "Email public identity",
  description:
    "Mailbox existence, Gravatar, then PGP. Not a claim that this is the person. EmailRep stays in email-identity-plus.",
  seedKinds: ["email"],
  steps: [
    "identity.email.lookup",
    "identity.gravatar.lookup",
    "identity.pgp.lookup",
  ],
};

export const emailIdentityPlus: PlaybookDef = {
  id: "email-identity-plus",
  title: "Email keyed identity",
  description:
    "Public identity steps plus EmailRep. Greys without an EmailRep vault slot.",
  seedKinds: ["email"],
  steps: [
    "identity.email.lookup",
    "identity.gravatar.lookup",
    "identity.emailrep.lookup",
    "identity.pgp.lookup",
  ],
};

export const emailBreach: PlaybookDef = {
  id: "email-breach",
  title: "Email breach metadata",
  description:
    "HIBP then Hudson Rock. Metadata-only — counts and stealer presence, not plaintext.",
  seedKinds: ["email"],
  steps: ["breach.hibp.lookup", "breach.hudsonrock.lookup"],
};

export const emailCorpus: PlaybookDef = {
  id: "email-corpus",
  title: "Email paid corpus",
  description:
    "Dehashed then Snusbase. Paid plaintext dumps — own recipe, not folded into metadata-only breach.",
  seedKinds: ["email"],
  steps: ["breach.dehashed.lookup", "breach.snusbase.lookup"],
};

export const hashMalware: PlaybookDef = {
  id: "hash-malware",
  title: "Hash public malware lookups",
  description:
    "CIRCL hashlookup then Cymru MHR for a file hash. MalwareBazaar stays in hash-malware-plus.",
  seedKinds: ["hash"],
  steps: ["threat.hashlookup.lookup", "threat.cymru_mhr.lookup"],
};

export const hashMalwarePlus: PlaybookDef = {
  id: "hash-malware-plus",
  title: "Hash keyed malware lookups",
  description:
    "hashlookup, MalwareBazaar, then Cymru MHR. Greys without a ThreatFox vault slot.",
  seedKinds: ["hash"],
  steps: [
    "threat.hashlookup.lookup",
    "threat.malwarebazaar.lookup",
    "threat.cymru_mhr.lookup",
  ],
};

export const handlePresence: PlaybookDef = {
  id: "handle-presence",
  title: "Handle presence",
  description:
    "GitHub then Keybase for a handle. Not a Maigret-class cross-site sweep.",
  seedKinds: ["handle"],
  steps: ["identity.github.lookup", "identity.keybase.lookup"],
};

export const hostContacts: PlaybookDef = {
  id: "host-contacts",
  title: "Host WHOIS then harvest contacts",
  description:
    "WHOIS, then harvest identifiers from that WHOIS Evidence (not the playbook seed). Privacy-proxy records often yield registrar/abuse mail only.",
  seedKinds: ["host"],
  steps: [
    "network.whois.lookup",
    {
      capabilityId: "evidence.harvest",
      bind: { evidenceId: { step: 0, bag: "evidenceId" } },
    },
  ],
};

export const urlResolve: PlaybookDef = {
  id: "url-resolve",
  title: "Resolve short URL then enrich page",
  description:
    "Unshorten, then page enrich using the final URL (seed URL if unshorten yields none). Bind, not timing-only.",
  seedKinds: ["url"],
  steps: [
    "web.url.unshorten",
    {
      capabilityId: "web.page.enrich",
      bind: { url: { step: 0, bag: "url" } },
    },
  ],
};

export const evidenceFile: PlaybookDef = {
  id: "evidence-file",
  title: "Analyze file then hashlookup",
  description:
    "File analyze, then hashlookup using the sha256 handoff from that Job.",
  seedKinds: ["evidence"],
  steps: [
    "evidence.file.analyze",
    {
      capabilityId: "threat.hashlookup.lookup",
      bind: { hash: { step: 0, bag: "hash" } },
    },
  ],
};

export const hostEnumerate: PlaybookDef = {
  id: "host-enumerate",
  title: "Enumerate CT names then DNS",
  description:
    "Certificate Transparency, then DNS per handed-off hostname (max 25, deduped). Empty CT names skip DNS and finish the run.",
  seedKinds: ["host"],
  steps: [
    "network.ct.lookup",
    {
      capabilityId: "network.dns.lookup",
      fanOut: { from: { step: 0, bag: "host" }, to: "host", max: 25 },
    },
  ],
};
