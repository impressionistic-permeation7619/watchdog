import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RouteError } from "@/shared/layout/route-error";

describe("RouteError", () => {
  it("shows the fetch error message from route errors", () => {
    render(<RouteError error={new Error("Case not found")} reset={() => {}} />);
    expect(screen.getByText("Case not found")).toBeInTheDocument();
  });
});
