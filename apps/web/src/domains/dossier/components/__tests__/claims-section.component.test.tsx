import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { testId } from "@watchdog/test-kit";

import type { ClaimRecord } from "@/domains/entities/claims/types";

vi.mock("@/auth/server", () => ({
  auth: {},
}));

vi.mock("@/domains/entities/claims/claims.functions", () => ({
  createClaimFn: vi.fn(),
  updateClaimFn: vi.fn(),
  retractClaimFn: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/shared/lib/query-invalidation", () => ({
  invalidateAfterEntityChanged: vi.fn().mockResolvedValue(undefined),
}));

const useSuspenseQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useSuspenseQuery: (...args: unknown[]) => useSuspenseQueryMock(...args),
    useMutation: (opts: {
      mutationFn: (...args: unknown[]) => unknown;
    }) => ({
      mutate: vi.fn(),
      mutateAsync: vi.fn(async (input: unknown) => opts.mutationFn(input)),
      isPending: false,
    }),
  };
});

import { ClaimsSection } from "@/domains/dossier/components/claims-section";

const ACTIVE: ClaimRecord = {
  id: testId(1),
  entityId: testId(20),
  text: "Observed at the scene",
  class: "observation",
  confidence: "possible",
  evidenceIds: [],
  retracted: false,
  retractKind: null,
  retractedReason: null,
  retractedBy: null,
  retractedAt: null,
};

function renderClaims(claims: ClaimRecord[]) {
  useSuspenseQueryMock.mockReturnValue({ data: claims });
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <ClaimsSection
        caseId={testId(10)}
        entityId={testId(20)}
        entitySlug="alpha"
        evidenceOptions={[]}
      />
    </QueryClientProvider>
  );
}

describe("ClaimsSection", () => {
  it("shows inline empty copy when there are no active claims", () => {
    renderClaims([]);
    expect(
      screen.getByText("No claims yet — add one or run a Capability.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });

  it("lists non-retracted claims", () => {
    renderClaims([ACTIVE]);
    expect(screen.getByText("Observed at the scene")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Claim actions" })
    ).toBeInTheDocument();
  });
});
