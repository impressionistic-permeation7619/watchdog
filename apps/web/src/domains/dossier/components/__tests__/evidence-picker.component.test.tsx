import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  EvidenceCiteChips,
  EvidencePicker,
} from "@/domains/dossier/components/evidence-picker";
import { testId } from "@watchdog/test-kit";

const OPTION = {
  id: testId(1),
  kind: "attestation" as const,
  label: "Photo",
};

describe("EvidencePicker re-export", () => {
  it("renders the add-evidence trigger when nothing is selected", () => {
    render(
      <EvidencePicker options={[OPTION]} selectedIds={[]} onChange={vi.fn()} />
    );
    expect(screen.getByLabelText("Add evidence")).toBeInTheDocument();
  });
});

describe("EvidenceCiteChips re-export", () => {
  it("renders cite chips for selected evidence ids", () => {
    render(<EvidenceCiteChips options={[OPTION]} ids={[OPTION.id]} />);
    expect(screen.getByText("Evidence")).toBeInTheDocument();
    expect(screen.getByText(/Photo/)).toBeInTheDocument();
  });
});
