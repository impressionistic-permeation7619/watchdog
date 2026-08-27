import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { EntityConnectionsCell } from "@/domains/entities/components/entity-connections-cell";
import type { EntityRecord } from "@/domains/entities/types";
import { testId } from "@watchdog/test-kit";

vi.mock("@/domains/entities/components/connection-composer-fields", () => ({
  ConnectionComposerFields: () => <div>Composer fields</div>,
}));

const ENTITY: EntityRecord = {
  id: testId(1),
  caseId: testId(10),
  slug: "alpha",
  name: "Alpha Entity",
  kind: "person",
  summary: null,
  notes: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("EntityConnectionsCell", () => {
  it("shows empty marker and add control when there are no peers", () => {
    render(
      <EntityConnectionsCell
        entity={ENTITY}
        peers={[]}
        entityOptions={[
          { id: testId(2), name: "Beta", slug: "beta", kind: "person" },
        ]}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />
    );

    expect(screen.getByText("—")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Add connection for Alpha Entity" })
    ).toBeInTheDocument();
  });
});
