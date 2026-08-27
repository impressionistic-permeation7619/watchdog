import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { VocabBadge } from "@/shared/ui/vocab/vocab-badge";

describe("VocabBadge", () => {
  it("renders label with low-contrast tone classes", () => {
    render(
      <VocabBadge
        label="Queued"
        tone={{
          low: "bg-status-queued-bg text-status-queued-fg",
          high: "bg-status-queued text-primary-foreground",
        }}
      />
    );
    expect(screen.getByText("Queued")).toBeInTheDocument();
  });

  it("prefers children over the label", () => {
    render(
      <VocabBadge label="Hidden" tone={{ low: "bg-muted", high: "bg-muted" }}>
        Visible
      </VocabBadge>
    );
    expect(screen.getByText("Visible")).toBeInTheDocument();
    expect(screen.queryByText("Hidden")).not.toBeInTheDocument();
  });
});
