import { describe, it, expect } from "vitest";

import { buildPageTrail, type TrailItem } from "../page-trail.ts";

const CASE = { name: "Boy Moment", slug: "boy-moment" };
const ENTITY = { name: "Ada" };

function labels(items: TrailItem[]): string[] {
  return items.map((item) => item.label);
}

function hrefTos(items: TrailItem[]): (string | undefined)[] {
  return items.map((item) => item.href?.to);
}

function trail(
  pathname: string,
  extra: Partial<Parameters<typeof buildPageTrail>[0]> = {}
) {
  return buildPageTrail({
    pathname,
    activeCase: CASE,
    routeCase: null,
    entity: null,
    ...extra,
  });
}

describe("buildPageTrail", () => {
  it("dashboard", () => {
    const items = trail("/");
    expect(labels(items)).toEqual(["Dashboard"]);
    expect(items[0]?.href).toBe(undefined);
  });

  it("cases list", () => {
    expect(labels(trail("/cases"))).toEqual(["Cases"]);
  });

  it("case overview links Cases to the manage list", () => {
    const items = trail("/cases/boy-moment", {
      routeCase: CASE,
    });
    expect(labels(items)).toEqual(["Cases", "Boy Moment"]);
    expect(items[0]?.href?.to).toBe("/cases");
    expect(items[1]?.href).toBe(undefined);
  });

  it("case overview uses the route Case, not Active Case", () => {
    const items = trail("/cases/other-slug", {
      routeCase: { name: "Other", slug: "other-slug" },
    });
    expect(labels(items)).toEqual(["Cases", "Other"]);
  });

  it("case overview falls back to slug before the Case loads", () => {
    const items = trail("/cases/boy-moment");
    expect(labels(items)).toEqual(["Cases", "boy-moment"]);
  });

  it("case-scoped surfaces prefix Active Case → Overview", () => {
    for (const [path, label] of [
      ["/entities", "Entities"],
      ["/identifiers", "Identifiers"],
      ["/graph", "Graph"],
      ["/inbox", "Inbox"],
      ["/jobs", "Jobs"],
      ["/intake", "Intake"],
      ["/tasks", "Tasks"],
    ] as const) {
      const items = trail(path);
      expect(labels(items), path).toEqual(["Boy Moment", label]);
      expect(items[0]?.id, path).toBe("case");
      expect(hrefTos(items), path).toEqual(["/cases/$caseSlug", undefined]);
      const href = items[0]?.href;
      expect(href && "params" in href ? href.params.caseSlug : "").toBe(
        "boy-moment"
      );
    }
  });

  it("dossier is Case / Entities / name", () => {
    const items = trail("/entities/ada", {
      entity: ENTITY,
    });
    expect(labels(items)).toEqual(["Boy Moment", "Entities", "Ada"]);
    expect(hrefTos(items)).toEqual([
      "/cases/$caseSlug",
      "/entities",
      undefined,
    ]);
  });

  it("dossier falls back to slug before entity loads", () => {
    const items = trail("/entities/ada");
    expect(labels(items)).toEqual(["Boy Moment", "Entities", "ada"]);
  });

  it("settings and style guide omit Case", () => {
    expect(labels(trail("/settings"))).toEqual(["Settings"]);
    expect(labels(trail("/ui"))).toEqual(["Style guide"]);
  });

  it("no Active Case omits the Case crumb", () => {
    const items = trail("/entities", { activeCase: null });
    expect(labels(items)).toEqual(["Entities"]);
  });
});
