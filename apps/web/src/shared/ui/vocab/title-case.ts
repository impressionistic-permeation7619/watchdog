/** Shared display helpers for schema vocabulary — no I/O. */

/** Keep these uppercase when title-casing ids / fallbacks. */
const ACRONYMS = new Set([
  "ai",
  "api",
  "css",
  "dns",
  "html",
  "http",
  "https",
  "ip",
  "json",
  "osint",
  "sha",
  "sha256",
  "sql",
  "tls",
  "url",
  "whois",
]);

/** snake_case / dotted id → Title Case words (acronyms stay UPPER). */
export function titleCase(value: string): string {
  return value
    .replaceAll(".", " ")
    .replaceAll("_", " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      if (ACRONYMS.has(lower)) return lower.toUpperCase();
      return lower.replace(/^\w/, (c) => c.toUpperCase());
    })
    .join(" ");
}

/** Exhaustive options for selects / facets from a label map. */
export function optionsFromLabels<T extends string>(
  values: readonly T[],
  labels: Record<T, string>
): { value: T; label: string }[] {
  return values.map((value) => ({ value, label: labels[value] }));
}
