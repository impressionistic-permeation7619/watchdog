import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DetailFooter } from "@/shared/ui/detail-footer";

describe("DetailFooter", () => {
  it("renders nothing when no actions are provided", () => {
    const { container } = render(<DetailFooter />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders trailing actions and optional leading content", () => {
    render(
      <DetailFooter leading={<span>Left</span>}>
        <button type="button">Save</button>
      </DetailFooter>
    );

    expect(screen.getByText("Left")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });
});
