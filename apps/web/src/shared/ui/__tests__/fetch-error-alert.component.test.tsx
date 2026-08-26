import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FetchErrorAlert } from "@/shared/ui/fetch-error-alert";

describe("FetchErrorAlert", () => {
  it("renders nothing when error is null", () => {
    const { container } = render(<FetchErrorAlert error={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows destructive alert copy when error is set", () => {
    render(<FetchErrorAlert error="Failed to load evidence" />);
    expect(screen.getByText("Failed to load evidence")).toBeInTheDocument();
  });
});
