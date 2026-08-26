import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DetailEmpty } from "@/shared/ui/detail-empty";

describe("DetailEmpty", () => {
  it("renders the default select-a-row empty state", () => {
    render(<DetailEmpty />);
    expect(screen.getByText("Select a row")).toBeInTheDocument();
    expect(
      screen.getByText("Choose a row from the queue to view detail.")
    ).toBeInTheDocument();
  });
});
