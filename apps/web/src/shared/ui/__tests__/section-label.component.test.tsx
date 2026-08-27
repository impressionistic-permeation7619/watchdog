import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SectionLabel } from "@/shared/ui/section-label";

describe("SectionLabel", () => {
  it("renders section headings with density variants", () => {
    const { rerender } = render(<SectionLabel>Overview</SectionLabel>);
    expect(
      screen.getByRole("heading", { name: "Overview" })
    ).toBeInTheDocument();

    rerender(
      <SectionLabel as="h4" density="compact">
        Details
      </SectionLabel>
    );
    expect(
      screen.getByRole("heading", { name: "Details", level: 4 })
    ).toBeInTheDocument();
  });
});
