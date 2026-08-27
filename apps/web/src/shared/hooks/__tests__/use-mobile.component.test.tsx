import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useIsMobile } from "@/shared/hooks/use-mobile";

function MobileProbe() {
  const mobile = useIsMobile();
  return <span>{mobile ? "mobile" : "desktop"}</span>;
}

describe("useIsMobile", () => {
  it("reports desktop width in jsdom", () => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    });

    render(<MobileProbe />);
    expect(screen.getByText("desktop")).toBeInTheDocument();
  });
});
