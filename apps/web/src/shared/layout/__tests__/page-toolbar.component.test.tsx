import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageToolbar } from "@/shared/layout/page-toolbar";

describe("PageToolbar", () => {
  it("renders leading, center, and trailing slots", () => {
    render(
      <PageToolbar
        leading={<div>Leading</div>}
        center={<div>Center</div>}
        trailing={<div>Trailing</div>}
      />
    );

    expect(screen.getByText("Leading")).toBeInTheDocument();
    expect(screen.getByText("Center")).toBeInTheDocument();
    expect(screen.getByText("Trailing")).toBeInTheDocument();
  });
});
