import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ComposerShell } from "@/shared/ui/composer-shell";

describe("ComposerShell", () => {
  it("renders children with default density styling", () => {
    render(<ComposerShell>Composer body</ComposerShell>);
    expect(screen.getByText("Composer body")).toHaveClass("bg-muted/30");
  });

  it("supports dense density and custom element type", () => {
    render(
      <ComposerShell as="section" density="dense" aria-label="Edit composer">
        Dense composer
      </ComposerShell>
    );

    expect(screen.getByLabelText("Edit composer")).toHaveClass("p-2.5");
  });
});
