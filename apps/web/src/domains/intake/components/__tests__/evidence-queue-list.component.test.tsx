import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { testId } from "@watchdog/test-kit";

import { EvidenceQueueList } from "@/domains/intake/components/evidence-queue-list";
import type { EvidenceRecord } from "@/domains/intake/types";

function evidence(overrides: Partial<EvidenceRecord> = {}): EvidenceRecord {
  return {
    id: testId(40),
    caseId: testId(10),
    entityId: null,
    kind: "attestation",
    label: "note",
    notes: null,
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

describe("EvidenceQueueList", () => {
  it("renders grouped evidence rows in the listbox", () => {
    const row = evidence();

    render(
      <EvidenceQueueList
        rows={[row]}
        jobs={[]}
        selectedId={row.id}
        onSelect={vi.fn()}
      />
    );

    expect(
      screen.getByRole("listbox", { name: "Evidence queue" })
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { selected: true })).toBeInTheDocument();
    expect(screen.getByText("unattached")).toBeInTheDocument();
  });
});
