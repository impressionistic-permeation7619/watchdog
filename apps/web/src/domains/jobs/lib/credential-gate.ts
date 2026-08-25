/** Wire-safe Cap / playbook credential specs (Jobs catalog). */
export type CredentialSpecWire =
  | { name: string; optional?: boolean }
  | { anyOf: string[] };

/** First unsatisfied required spec, or undefined when the vault covers the Cap. */
export function missingCredentialNames(
  specs: readonly CredentialSpecWire[] | undefined,
  configured: ReadonlySet<string>
): string[] | undefined {
  for (const spec of specs ?? []) {
    if ("anyOf" in spec) {
      if (!spec.anyOf.some((n) => configured.has(n))) {
        return [...spec.anyOf];
      }
      continue;
    }
    if (spec.optional === true) continue;
    if (!configured.has(spec.name)) return [spec.name];
  }
  return undefined;
}

export function missingCredentialReason(
  names: readonly string[],
  subject: "Cap" | "playbook"
): string {
  const target = subject === "Cap" ? "this Cap" : "this playbook";
  if (names.length === 1) {
    return `Connect ${names[0]} in Settings before running ${target}`;
  }
  return `Connect one of ${names.join(" | ")} in Settings before running ${target}`;
}
