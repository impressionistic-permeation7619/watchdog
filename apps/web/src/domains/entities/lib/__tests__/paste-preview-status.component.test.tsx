import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PastePreviewStatus } from "@/domains/entities/components/paste-preview-status";

describe("PastePreviewStatus", () => {
  it("shows Not found for Entity not found", () => {
    render(<PastePreviewStatus error="Entity not found" />);
    expect(screen.getByText("Not found")).toBeInTheDocument();
  });

  it("shows Ambiguous for Entity is ambiguous", () => {
    render(<PastePreviewStatus error="Entity is ambiguous" />);
    expect(screen.getByText("Ambiguous")).toBeInTheDocument();
  });
});
