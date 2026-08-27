/** True on `/cases/$caseSlug` (Overview) — not Manage `/cases`. */
export function isCaseOverviewPath(pathname: string): boolean {
  return /^\/cases\/[^/]+/.test(pathname);
}
