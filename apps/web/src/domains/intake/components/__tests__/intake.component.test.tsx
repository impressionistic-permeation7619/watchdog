import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { testId } from "@watchdog/test-kit";

import type { CaseRecord } from "@/domains/cases/types";

vi.mock("@/auth/server", () => ({
  auth: {},
}));

vi.mock("@/shared/layout/app-breadcrumbs", () => ({
  AppBreadcrumbs: () => null,
}));

vi.mock("@/shared/layout/page", () => ({
  PageHeader: () => <div>Intake page header</div>,
}));

vi.mock("@/shared/ui/shadcn/sidebar", () => ({
  SidebarTrigger: () => <button type="button">Menu</button>,
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
  Navigate: () => null,
}));

vi.mock("@/domains/intake/components/dump-dialogs", () => ({
  DumpDialogs: () => null,
}));

vi.mock("@/domains/intake/components/evidence-detail", () => ({
  EvidenceDetail: () => <div>Evidence detail panel</div>,
}));

vi.mock("@/domains/intake/components/evidence-queue-list", () => ({
  EvidenceQueueList: () => <div>Evidence queue list</div>,
}));

vi.mock("@/domains/intake/components/intake-queue-toolbar", () => ({
  IntakeQueueToolbar: () => <div>Intake queue toolbar</div>,
}));

vi.mock("@/shared/ui/split-view", () => ({
  SplitView: ({
    list,
    detail,
  }: {
    list: React.ReactNode;
    detail: React.ReactNode;
  }) => (
    <div>
      <div data-testid="split-list">{list}</div>
      <div data-testid="split-detail">{detail}</div>
    </div>
  ),
}));

vi.mock("@/shared/hooks/use-live-events", () => ({
  useLiveEvents: vi.fn(),
}));

const useSuspenseQueryMock = vi.hoisted(() => vi.fn());
const useIntakeActionsMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useSuspenseQuery: (...args: unknown[]) => useSuspenseQueryMock(...args),
  };
});

vi.mock("@/domains/intake/hooks/use-intake-actions", () => ({
  useIntakeActions: (...args: unknown[]) => useIntakeActionsMock(...args),
}));

vi.mock("@/shared/lib/query-invalidation", () => ({
  bindCasesChangedInvalidation: vi.fn(),
  invalidateAfterJobMutation: vi.fn(),
  invalidateAfterEvidenceMutation: vi.fn(),
}));

import { Intake } from "@/domains/intake/components/intake";

const ACTIVE: CaseRecord = {
  id: testId(10),
  slug: "alpha",
  name: "Alpha",
  description: null,
  allowThirdPartyEgress: false,
};

function evidence(id: string) {
  return {
    id,
    caseId: ACTIVE.id,
    entityId: null,
    kind: "attestation" as const,
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
  };
}

function mockQueries() {
  useSuspenseQueryMock.mockImplementation((options: { queryKey?: unknown[] }) => {
    const key = options.queryKey?.[0];
    if (key === "cases") {
      return { data: { active: ACTIVE, cases: [ACTIVE] } };
    }
    if (key === "entities") {
      return { data: [] };
    }
    if (key === "jobs") {
      return { data: [] };
    }
    if (key === "evidence") {
      return { data: [evidence(testId(40))] };
    }
    return { data: [] };
  });
}

function mockIntakeActions() {
  useIntakeActionsMock.mockReturnValue({
    actionError: null,
    entityId: "",
    setEntityId: vi.fn(),
    busy: false,
    uploading: false,
    uploadStatus: null,
    dumpingPaste: false,
    dumpingUrl: false,
    onFiles: vi.fn(),
    onPaste: vi.fn(),
    onUrl: vi.fn(),
    evidenceActions: {
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
    },
  });
}

describe("Intake", () => {
  it("shows no active case copy when nothing is selected", () => {
    useSuspenseQueryMock.mockReturnValue({
      data: { active: null, cases: [] },
    });

    render(
      <QueryClientProvider client={new QueryClient()}>
        <Intake onEvidenceIdChange={vi.fn()} />
      </QueryClientProvider>
    );

    expect(screen.getByText("No Active Case")).toBeInTheDocument();
    expect(screen.getByText("Select a Case")).toBeInTheDocument();
    expect(screen.queryByText("Evidence queue list")).not.toBeInTheDocument();
    expect(useSuspenseQueryMock).toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Select a Case" })).toHaveAttribute(
      "href",
      "/cases"
    );
  });

  it("renders intake workspace chrome when a case is active", () => {
    mockQueries();
    mockIntakeActions();

    render(
      <QueryClientProvider client={new QueryClient()}>
        <Intake evidenceId={testId(40)} onEvidenceIdChange={vi.fn()} />
      </QueryClientProvider>
    );

    expect(screen.getByText("Intake page header")).toBeInTheDocument();
    expect(screen.getByText("Intake queue toolbar")).toBeInTheDocument();
    expect(screen.getByText("Evidence queue list")).toBeInTheDocument();
    expect(screen.getByText("Evidence detail panel")).toBeInTheDocument();
    expect(screen.getByTestId("split-list")).toBeInTheDocument();
    expect(screen.getByTestId("split-detail")).toBeInTheDocument();
    expect(useIntakeActionsMock).toHaveBeenCalled();
    expect(useSuspenseQueryMock).toHaveBeenCalled();
    expect(screen.queryByText("No Active Case")).not.toBeInTheDocument();
  });
});
