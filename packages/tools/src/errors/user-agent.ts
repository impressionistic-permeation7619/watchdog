/** Default Watchdog User-Agent for tools HTTP/DNS egress (Cap may override). */
export function watchdogUserAgent(capId: string): string {
  return `Watchdog/1.0 (+${capId}; OSINT)`;
}
