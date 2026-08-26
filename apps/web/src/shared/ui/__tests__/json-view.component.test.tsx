import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { JsonView } from "@/shared/ui/json-view";

describe("JsonView", () => {
  it("renders an accessible JSON tree", () => {
    render(<JsonView data={{ ok: true, count: 2 }} />);
    expect(screen.getByRole("tree", { name: "JSON" })).toBeInTheDocument();
    expect(screen.getByText('"ok"')).toBeInTheDocument();
    expect(screen.getByText("true")).toBeInTheDocument();
  });
});
