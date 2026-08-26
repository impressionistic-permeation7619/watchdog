import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  STATUS_DOT,
  STATUS_LABELS,
  statusLabel,
  StatusBadge,
} from "@/shared/ui/vocab/status";

describe("status vocab", () => {
  it("maps display statuses to labels and dot classes", () => {
    expect(statusLabel("running")).toBe(STATUS_LABELS.running);
    expect(STATUS_DOT.failed).toContain("status-failed");
  });

  it("renders status badge copy", () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });
});
