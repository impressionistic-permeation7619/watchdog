import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { IdentifierEvidenceCell } from "@/domains/dossier/components/identifier-evidence-cell";
import { testId } from "@watchdog/test-kit";

describe("IdentifierEvidenceCell re-export", () => {
  it("shows Link placeholder when no evidence is attached", () => {
    render(
      <IdentifierEvidenceCell
        row={{ id: testId(1), evidenceIds: [] }}
        evidenceOptions={[]}
        saveEvidence={vi.fn()}
      />
    );
    expect(screen.getByText("Link…")).toBeInTheDocument();
  });

  it("shows evidence id chips when links exist", () => {
    const evidenceId = testId(40);
    render(
      <IdentifierEvidenceCell
        row={{ id: testId(1), evidenceIds: [evidenceId] }}
        evidenceOptions={[
          { id: evidenceId, kind: "attestation", label: "Photo" },
        ]}
        saveEvidence={vi.fn()}
      />
    );
    expect(screen.getByText(evidenceId.slice(0, 8))).toBeInTheDocument();
  });
});
