import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { EmptyState } from "@/shared/ui/empty-state";

describe("EmptyState", () => {
  it("renders blank-slate copy", () => {
    render(<EmptyState intent="blank-slate" items="jobs" />);
    expect(screen.getByText("No Jobs Yet")).toBeInTheDocument();
  });

  it("offers clear-filters CTA for filtered no-results", async () => {
    const user = userEvent.setup();
    const onClearFilters = vi.fn();
    render(
      <EmptyState
        intent="no-results"
        items="proposals"
        query="alpha"
        onClearFilters={onClearFilters}
      />
    );

    await user.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onClearFilters).toHaveBeenCalledOnce();
  });
});
