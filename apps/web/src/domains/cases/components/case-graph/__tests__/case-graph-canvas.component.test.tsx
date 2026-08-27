import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/auth/server", () => ({
  auth: {},
}));

import { CaseGraphCanvas } from "@/domains/cases/components/case-graph/case-graph-canvas";
import { CASE_GRAPH_ENTITY_CAP } from "@/domains/cases/components/case-graph/case-graph-layout";
import type { EntityRecord } from "@/domains/entities/types";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useSuspenseQuery: () => ({ data: [] }),
  };
});

const ENTITY: EntityRecord = {
  id: "ent-1",
  caseId: "case-1",
  slug: "alpha",
  name: "Alpha",
  kind: "person",
  summary: null,
  notes: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("CaseGraphCanvas", () => {
  it("shows a blank slate when there are no entities", () => {
    render(<CaseGraphCanvas caseId="case-1" entities={[]} />);
    expect(screen.getByText("No entities yet")).toBeInTheDocument();
  });

  it("shows a cap message when the entity count exceeds the preview limit", () => {
    const entities = Array.from(
      { length: CASE_GRAPH_ENTITY_CAP + 1 },
      (_, i) => ({
        ...ENTITY,
        id: `ent-${i}`,
        slug: `entity-${i}`,
        name: `Entity ${i}`,
      })
    );
    render(<CaseGraphCanvas caseId="case-1" entities={entities} />);
    expect(
      screen.getByText(
        `Graph preview caps at ${CASE_GRAPH_ENTITY_CAP} entities`
      )
    ).toBeInTheDocument();
  });
});
