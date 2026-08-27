import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DossierSectionAddButton } from "@/domains/dossier/components/dossier-section-add-button";

describe("DossierSectionAddButton", () => {
  it("renders a ghost header add button", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<DossierSectionAddButton variant="ghost" onClick={onClick} />);
    await user.click(screen.getByRole("button", { name: "Add" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders a panel CTA with the noun label", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <DossierSectionAddButton variant="panel" noun="claim" onClick={onClick} />
    );
    await user.click(screen.getByRole("button", { name: "Add claim" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
