import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  EvidenceDetailHeader,
  EvidenceHeaderActions,
} from "@/domains/intake/components/evidence-detail-header";
import type { IntakeEvidenceActions } from "@/domains/intake/hooks/use-intake-actions";
import type { EvidenceRecord } from "@/domains/intake/types";
import { Tabs } from "@/shared/ui/shadcn/tabs";
import { testId } from "@watchdog/test-kit";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    to?: string;
  }) => <a {...props}>{children}</a>,
}));

function evidence(overrides: Partial<EvidenceRecord> = {}): EvidenceRecord {
  return {
    id: testId(40),
    caseId: testId(10),
    entityId: null,
    kind: "attestation",
    label: "note",
    notes: "Analyst note",
    mime: "text/plain",
    uri: null,
    sha256: null,
    text: "hello",
    sourceUrl: null,
    actorId: "test-actor",
    capturedAt: "2026-01-01T00:00:00.000Z",
    processedAt: null,
    deletedAt: null,
    ...overrides,
  };
}

function intakeActions(
  overrides: Partial<IntakeEvidenceActions> = {}
): IntakeEvidenceActions {
  return {
    busy: false,
    processing: false,
    aiProcessing: false,
    enriching: false,
    attaching: false,
    onProcess: vi.fn(),
    onAiProcess: vi.fn(),
    onEnrich: vi.fn(),
    onHide: vi.fn(),
    onRestore: vi.fn(),
    onAttachEntity: vi.fn(),
    ...overrides,
  };
}

describe("EvidenceDetailHeader", () => {
  it("renders evidence identity, lifecycle status, and tabs", () => {
    render(
      <Tabs value="content">
        <EvidenceDetailHeader
          evidence={evidence()}
          isHidden={false}
          processed={false}
          producingCap={null}
          canEnrich={false}
          enrichJobs={[]}
          enrichOutput={null}
          relatedJobs={[]}
        />
      </Tabs>
    );

    expect(
      screen.getByRole("navigation", { name: "Evidence path" })
    ).toBeInTheDocument();
    expect(screen.getByText("unprocessed")).toBeInTheDocument();
    expect(screen.getByText("Unattached")).toBeInTheDocument();
    expect(screen.getByText("Analyst note")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Content" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Jobs" })).toBeInTheDocument();
  });
});

describe("EvidenceHeaderActions", () => {
  it("shows harvest controls for active evidence", () => {
    render(
      <EvidenceHeaderActions
        isHidden={false}
        actions={intakeActions()}
        canEnrich={false}
        processed={false}
        allowThirdPartyEgress
        onHideRequested={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Harvest" })).toBeInTheDocument();
    expect(screen.getAllByText("Extract (AI)").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Hide" })).toBeInTheDocument();
  });

  it("shows restore when evidence is hidden", () => {
    render(
      <EvidenceHeaderActions
        isHidden
        actions={intakeActions()}
        canEnrich={false}
        processed={false}
        onHideRequested={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "Restore" })).toBeInTheDocument();
  });
});
