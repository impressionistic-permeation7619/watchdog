import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExternalUrl } from "@/shared/ui/external-url";

describe("ExternalUrl", () => {
  it("renders an external link with safe rel attributes", () => {
    render(<ExternalUrl href="https://example.com/path" />);
    const link = screen.getByRole("link", { name: /example\.com/ });
    expect(link).toHaveAttribute("href", "https://example.com/path");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});
