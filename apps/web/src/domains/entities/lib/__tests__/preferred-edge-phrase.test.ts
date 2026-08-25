import { describe, it, expect } from "vitest";

import {
  clampEdgePhrase,
  edgePhraseOptions,
  preferredEdgePhrase,
} from "../../../../shared/ui/vocab/edge-predicate.ts";

function requirePhrase(hit: ReturnType<typeof preferredEdgePhrase>) {
  expect(hit).toBeDefined();
  if (hit === null) throw new TypeError("expected a preferred phrase");
  return hit;
}

describe("preferred-edge-phrase", () => {
  it("preferredEdgePhrase: org → infra defaults to primary_domain forward", () => {
    const hit = requirePhrase(preferredEdgePhrase("org", "infra"));
    expect(hit.predicate).toBe("primary_domain");
    expect(hit.orientation).toBe("forward");
    expect(hit.group).toBe("Domains & Hosting");
  });

  it("preferredEdgePhrase: infra → org defaults to primary_domain inverse", () => {
    const hit = requirePhrase(preferredEdgePhrase("infra", "org"));
    expect(hit.predicate).toBe("primary_domain");
    expect(hit.orientation).toBe("inverse");
    expect(hit.group).toBe("Domains & Hosting");
  });

  it("preferredEdgePhrase: org → org defaults to parent_of forward", () => {
    const hit = requirePhrase(preferredEdgePhrase("org", "org"));
    expect(hit.predicate).toBe("parent_of");
    expect(hit.orientation).toBe("forward");
    expect(hit.group).toBe("Ownership & Control");
  });

  it("preferredEdgePhrase: infra → infra defaults to parent_of forward", () => {
    const hit = requirePhrase(preferredEdgePhrase("infra", "infra"));
    expect(hit.predicate).toBe("parent_of");
    expect(hit.orientation).toBe("forward");
  });

  it("preferredEdgePhrase: other pairs return a valid option", () => {
    const hit = requirePhrase(preferredEdgePhrase("person", "org"));
    expect(hit.value.includes(":")).toBeTruthy();
  });

  it("edgePhraseOptions: both orientations share semantic group", () => {
    const opts = edgePhraseOptions({ fromKind: "org", toKind: "org" });
    const byValue = new Map(opts.map((o) => [o.value, o]));

    expect(byValue.get("parent_of:forward")?.group).toBe("Ownership & Control");
    expect(byValue.get("parent_of:inverse")?.group).toBe("Ownership & Control");
    expect(byValue.get("owns:forward")?.group).toBe("Ownership & Control");
    expect(byValue.get("owns:inverse")?.group).toBe("Ownership & Control");
    expect(byValue.get("leads:forward")?.group).toBe("Roles & Affiliation");
    expect(byValue.get("founded:forward")?.group).toBe("Roles & Affiliation");
    expect(byValue.get("member_of:forward")?.group).toBe("Roles & Affiliation");
    expect(byValue.get("same_as:forward")?.group).toBe("Identity");
    expect(byValue.get("suspected_as:forward")?.group).toBe("Identity");
    expect(byValue.get("suspected_as:inverse")?.group).toBe("Identity");
    expect(byValue.get("related_to:forward")?.group).toBe("Other");
  });

  it("clampEdgePhrase: keeps valid phrase", () => {
    const hit = clampEdgePhrase("org", "infra", "primary_domain", "forward");
    expect(hit.predicate).toBe("primary_domain");
    expect(hit.orientation).toBe("forward");
  });

  it("clampEdgePhrase: invalid falls to preferred", () => {
    const hit = clampEdgePhrase("org", "infra", "leads", "forward");
    expect(hit.predicate).toBe("primary_domain");
    expect(hit.orientation).toBe("forward");
  });
});
