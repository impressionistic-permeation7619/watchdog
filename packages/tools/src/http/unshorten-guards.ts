import { isIP, isIPv4 } from "node:net";

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

function parseUrlHostname(raw: string): string | null {
  try {
    return new URL(raw).hostname.replace(/^\[/, "").replace(/\]$/, "");
  } catch {
    return null;
  }
}

function isBlockedHostname(host: string): boolean {
  return host === "localhost" || host.endsWith(".localhost");
}

function isBlockedIpv6(host: string): boolean {
  return (
    host === "::1" ||
    host.startsWith("fe80:") ||
    host.startsWith("fc") ||
    host.startsWith("fd")
  );
}

const PRIVATE_IPV4_RULES: ((a: number, b: number) => boolean)[] = [
  (a) => a === 10 || a === 127 || a === 0,
  (a, b) => a === 169 && b === 254,
  (a, b) => a === 192 && b === 168,
  (a, b) => a === 172 && b >= 16 && b <= 31,
  (a, b) => a === 100 && b >= 64 && b <= 127,
];

function isPrivateIpv4(octets: number[]): boolean {
  const a = octets[0] ?? 0;
  const b = octets[1] ?? 0;
  return PRIVATE_IPV4_RULES.some((rule) => rule(a, b));
}

function isBlockedIpv4(host: string): boolean {
  if (!isIPv4(host)) return false;
  return isPrivateIpv4(host.split(".").map(Number));
}

/** Block private, loopback, link-local, and CGNAT hop URLs. */
export function isBlockedUnshortenUrl(raw: string): boolean {
  const hostname = parseUrlHostname(raw);
  if (hostname === null) return true;
  const host = hostname.toLowerCase();
  if (isBlockedHostname(host)) return true;
  if (!isIP(host)) return false;
  if (isBlockedIpv6(host)) return true;
  return isBlockedIpv4(host);
}

export function isRedirectStatus(status: number): boolean {
  return REDIRECT_STATUSES.has(status);
}

export function isRedirectResponse(
  status: number,
  location: string | null
): location is string {
  return location !== null && isRedirectStatus(status);
}

export function resolveRedirectUrl(current: string, location: string): string {
  return new URL(location, current).href;
}
