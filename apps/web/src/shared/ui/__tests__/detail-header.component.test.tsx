import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DetailHeader } from "@/shared/ui/detail-header";

describe("DetailHeader", () => {
  it("renders title, meta, status, id chip, and note", () => {
    render(
      <DetailHeader
        title="Evidence item"
        id="8680fa38-0c1d-4e2f-9a3b-595335c1d2e3"
        meta="Queued · 2m ago"
        status={<span>Pending</span>}
        note="Summary text"
      />
    );

    expect(
      screen.getByRole("heading", { name: "Evidence item" })
    ).toBeInTheDocument();
    expect(screen.getByText("Queued · 2m ago")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Summary text")).toBeInTheDocument();
  });
});
