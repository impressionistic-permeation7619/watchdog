import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TabCount } from "@/shared/ui/tab-count";

describe("TabCount", () => {
  it("renders nothing at zero", () => {
    const { container } = render(<TabCount n={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the count when non-zero", () => {
    render(<TabCount n={12} />);
    expect(screen.getByText("12")).toBeInTheDocument();
  });
});
