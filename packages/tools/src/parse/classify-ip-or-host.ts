import { isIP } from "node:net";

import { normalizeIp } from "../dns/reverse";
import { normalizeHost } from "../whois/normalize";

/** Classify a seed as IP or domain and normalize. Throws on invalid domain. */
export function classifyIpOrHost(raw: string): {
  kind: "ip" | "domain";
  value: string;
} {
  const trimmed = raw.trim();
  if (isIP(trimmed)) return { kind: "ip", value: normalizeIp(trimmed) };
  return { kind: "domain", value: normalizeHost(trimmed) };
}
