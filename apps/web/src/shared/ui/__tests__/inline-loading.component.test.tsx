import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InlineLoading } from "@/shared/ui/inline-loading";

describe("InlineLoading", () => {
  it("renders the default loading label", () => {
    render(<InlineLoading />);
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("renders a custom label and busy state", () => {
    render(<InlineLoading label="Fetching jobs" />);
    const region = screen.getByText("Fetching jobs").closest("[aria-busy]");
    expect(region).toHaveAttribute("aria-live", "polite");
  });
});
