import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ClaimClassSelect } from "@/domains/dossier/components/graph-field-selects";

describe("ClaimClassSelect", () => {
  it("renders the selected claim class label", () => {
    render(<ClaimClassSelect value="observation" onChange={vi.fn()} />);
    expect(
      screen.getByRole("combobox", { name: "Claim class" })
    ).toHaveTextContent("Observation");
  });
});
