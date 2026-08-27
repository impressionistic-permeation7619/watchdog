import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Timestamp } from "@/shared/ui/timestamp";

describe("Timestamp", () => {
  it("renders children inside a time element for valid ISO values", () => {
    render(
      <Timestamp value="2026-01-01T12:00:00.000Z">
        <span>12:00</span>
      </Timestamp>
    );

    const time = screen.getByText("12:00").closest("time");
    expect(time).toHaveAttribute("dateTime", "2026-01-01T12:00:00.000Z");
  });

  it("falls back to plain children for invalid values", () => {
    render(
      <Timestamp value="not-a-date">
        <span>unknown</span>
      </Timestamp>
    );
    expect(screen.getByText("unknown")).toBeInTheDocument();
    expect(screen.queryByRole("time")).not.toBeInTheDocument();
  });
});
