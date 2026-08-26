import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SectionHeaderBar } from "@/shared/ui/section-header-bar";

describe("SectionHeaderBar", () => {
  it("renders title, count, and action", () => {
    render(
      <SectionHeaderBar
        title="Evidence"
        count={3}
        action={<button type="button">Refresh</button>}
      />
    );

    expect(screen.getByText("Evidence")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
  });
});
