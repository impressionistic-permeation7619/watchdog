import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MiddleTruncate } from "@/shared/ui/middle-truncate";

describe("MiddleTruncate", () => {
  it("shows head and tail for long values", () => {
    render(<MiddleTruncate value="abcdef1234567890abcdef" head={4} tail={4} />);
    expect(screen.getByText("abcd")).toBeInTheDocument();
    expect(screen.getByText("cdef")).toBeInTheDocument();
  });

  it("shows the full value when already short", () => {
    render(<MiddleTruncate value="short" head={8} tail={6} />);
    expect(screen.getByText("short")).toBeInTheDocument();
  });
});
