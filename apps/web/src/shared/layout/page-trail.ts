export type TrailTo =
  | { to: "/" }
  | { to: "/cases" }
  | { to: "/cases/$caseSlug"; params: { caseSlug: string } }
  | { to: "/entities" }
  | { to: "/identifiers" }
  | { to: "/graph" }
  | { to: "/inbox" }
  | { to: "/jobs" }
  | { to: "/intake" }
  | { to: "/tasks" }
  | { to: "/settings" }
  | { to: "/ui" };

export interface TrailItem {
  id: string;
  label: string;
  href?: TrailTo;
}

/** Last-crumb ids that may show `PageHeader count`. */
export type CountOnTrailId = "entities" | "identifiers" | "tasks";

export interface PageTrailInput {
  pathname: string;
  activeCase: { name: string; slug: string } | null;
  /** Case named by `/cases/$caseSlug` (may differ from Active Case). */
  routeCase: { name: string; slug: string } | null;
  entity: { name: string } | null;
}

function pathSegments(pathname: string): string[] {
  return pathname.replace(/\/+$/, "").split("/").filter(Boolean);
}

function current(id: string, label: string): TrailItem {
  return { id, label };
}

function link(id: string, label: string, href: TrailTo): TrailItem {
  return { id, label, href };
}

function caseCrumb(activeCase: { name: string; slug: string }): TrailItem {
  return link("case", activeCase.name, {
    to: "/cases/$caseSlug",
    params: { caseSlug: activeCase.slug },
  });
}

function withCase(
  activeCase: { name: string; slug: string } | null,
  rest: TrailItem[]
): TrailItem[] {
  if (!activeCase) return rest;
  return [caseCrumb(activeCase), ...rest];
}

/**
 * Last item is the current page. Case crumbs come from Active Case, not the Work URL.
 */
export function buildPageTrail(input: PageTrailInput): TrailItem[] {
  const segs = pathSegments(input.pathname);
  const head = segs[0] ?? "";
  const next = segs[1];

  switch (head) {
    case "": {
      return [current("dashboard", "Dashboard")];
    }
    case "cases": {
      if (next === undefined) {
        return [current("cases", "Cases")];
      }
      const name = input.routeCase?.name ?? next;
      return [link("cases", "Cases", { to: "/cases" }), current("case", name)];
    }
    case "entities": {
      if (next === undefined) {
        return withCase(input.activeCase, [current("entities", "Entities")]);
      }
      const entityName = input.entity?.name ?? next;
      return withCase(input.activeCase, [
        link("entities", "Entities", { to: "/entities" }),
        current("entity", entityName),
      ]);
    }
    case "identifiers": {
      return withCase(input.activeCase, [
        current("identifiers", "Identifiers"),
      ]);
    }
    case "graph": {
      return withCase(input.activeCase, [current("graph", "Graph")]);
    }
    case "inbox": {
      return withCase(input.activeCase, [current("inbox", "Inbox")]);
    }
    case "jobs": {
      return withCase(input.activeCase, [current("jobs", "Jobs")]);
    }
    case "intake": {
      return withCase(input.activeCase, [current("intake", "Intake")]);
    }
    case "tasks": {
      return withCase(input.activeCase, [current("tasks", "Tasks")]);
    }
    case "settings": {
      return [current("settings", "Settings")];
    }
    case "ui": {
      return [current("ui", "Style guide")];
    }
    default: {
      return [current("unknown", "Watchdog")];
    }
  }
}
