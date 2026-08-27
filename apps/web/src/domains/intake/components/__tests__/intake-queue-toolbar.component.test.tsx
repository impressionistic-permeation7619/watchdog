import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { IntakeQueueToolbar } from "@/domains/intake/components/intake-queue-toolbar";
import { EMPTY_INTAKE_FILTERS } from "@/domains/intake/lib/filters";

vi.mock("@/shared/ui/entity-combobox", () => ({
  EntityCombobox: ({ "aria-label": ariaLabel }: { "aria-label"?: string }) => (
    <select aria-label={ariaLabel} />
  ),
}));

describe("IntakeQueueToolbar", () => {
  it("renders search, filter menu, and dump controls", () => {
    render(
      <IntakeQueueToolbar
        entities={[]}
        entityId=""
        onEntityIdChange={vi.fn()}
        filters={EMPTY_INTAKE_FILTERS}
        onFiltersChange={vi.fn()}
        onDump={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Search evidence")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Filters/ })).toBeInTheDocument();
    expect(screen.getByLabelText("Target entity")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "File" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Paste" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "URL" })).toBeInTheDocument();
  });
});
