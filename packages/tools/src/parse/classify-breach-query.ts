import { classifyIpOrHost } from "./classify-ip-or-host";

export type BreachQueryKind = "email" | "ip" | "domain" | "username";

/** Classify breach-corpus seeds: email → IP/domain via `classifyIpOrHost` → username. */
export function classifyBreachQuery(raw: string): {
  kind: BreachQueryKind;
  value: string;
} {
  const trimmed = raw.trim();
  if (trimmed.includes("@")) {
    return { kind: "email", value: trimmed.toLowerCase() };
  }
  try {
    return classifyIpOrHost(trimmed);
  } catch {
    return { kind: "username", value: trimmed };
  }
}
