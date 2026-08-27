import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RelativeTime } from "@/shared/ui/relative-time";
import { formatRelativeTime } from "@/shared/ui/relative-time.lib";

describe("RelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("formats recent instants", () => {
    expect(formatRelativeTime("2026-01-01T11:50:00.000Z")).toBe("10m ago");
    expect(formatRelativeTime("2026-01-01T11:00:00.000Z")).toBe("1h ago");
  });

  it("renders empty fallback for missing values", () => {
    render(<RelativeTime value={null} empty="n/a" />);
    expect(screen.getByText("n/a")).toBeInTheDocument();
  });
});
