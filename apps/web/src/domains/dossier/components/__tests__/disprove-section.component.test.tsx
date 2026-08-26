import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { testId } from "@watchdog/test-kit";

import type { ClaimRecord } from "@/domains/entities/claims/types";

vi.mock("@/auth/server", () => ({
  auth: {},
}));

const useSuspenseQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useSuspenseQuery: (...args: unknown[]) => useSuspenseQueryMock(...args),
  };
});

import { DisproveSection } from "@/domains/dossier/components/disprove-section";

const RETRACTED: ClaimRecord = {
  id: testId(1),
  entityId: testId(20),
  text: "Former claim",
  class: "observation",
  confidence: "unverified",
  evidenceIds: [],
  retracted: true,
  retractKind: "disproved",
  retractedReason: "Contradicted by intake",
  retractedBy: null,
  retractedAt: "2026-01-02T00:00:00.000Z",
};

function renderSection(claims: ClaimRecord[]) {
  useSuspenseQueryMock.mockReturnValue({ data: claims });
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <DisproveSection caseId={testId(10)} entityId={testId(20)} />
    </QueryClientProvider>
  );
}

describe("DisproveSection", () => {
  it("renders nothing when there are no retracted claims", () => {
    const { container } = renderSection([]);
    expect(container).toBeEmptyDOMElement();
  });

  it("lists retracted claims with reason and badges", () => {
    renderSection([RETRACTED]);
    expect(
      screen.getByRole("heading", { name: "Disproved / Retracted" })
    ).toBeInTheDocument();
    expect(screen.getByText("Former claim")).toHaveClass("line-through");
    expect(screen.getByText("Contradicted by intake")).toBeInTheDocument();
  });
});
