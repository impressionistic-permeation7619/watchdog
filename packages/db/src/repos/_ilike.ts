/** Build an ILIKE contains pattern; strip user wildcards so %/_ stay literal. */
export function containsPattern(term: string): string | null {
  const cleaned = term.replaceAll(/[%_]/g, "").trim();
  if (cleaned.length === 0) return null;
  return `%${cleaned}%`;
}
