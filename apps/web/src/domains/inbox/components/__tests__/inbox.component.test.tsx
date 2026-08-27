import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CaseRecord } from "@/domains/cases/types";
import { testId } from "@watchdog/test-kit";

vi.mock("@/auth/server", () => ({
  auth: {},
}));

vi.mock("@/shared/layout/app-breadcrumbs", () => ({
  AppBreadcrumbs: () => null,
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

vi.mock("@/domains/inbox/components/inbox-detail", () => ({
  InboxDetail: () => <div>Inbox detail panel</div>,
}));

vi.mock("@/domains/inbox/components/inbox-queue-list", () => ({
  InboxQueueList: () => <div>Inbox queue list</div>,
}));

vi.mock("@/domains/inbox/components/inbox-queue-toolbar", () => ({
  InboxQueueToolbar: () => <div>Inbox queue toolbar</div>,
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

const useSuspenseQueryMock = vi.hoisted(() => vi.fn());
const useInboxWorkspaceMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useSuspenseQuery: (...args: unknown[]) => useSuspenseQueryMock(...args),
  };
});

vi.mock("@/domains/inbox/hooks/use-inbox-workspace", () => ({
  useInboxWorkspace: (...args: unknown[]) => useInboxWorkspaceMock(...args),
}));

vi.mock("@/shared/lib/query-invalidation", () => ({
  bindCasesChangedInvalidation: vi.fn(),
}));

import { Inbox } from "@/domains/inbox/components/inbox";

const ACTIVE: CaseRecord = {
  id: testId(10),
  slug: "alpha",
  name: "Alpha",
  description: null,
  allowThirdPartyEgress: false,
};

function mockWorkspace() {
  useInboxWorkspaceMock.mockReturnValue({
    allProposals: [{ id: testId(50) }],
    rows: [{ id: testId(50) }],
    filters: { q: "", statuses: ["pending"] },
    setFilters: vi.fn(),
    pendingCount: 1,
    selectedId: testId(50),
    selected: { id: testId(50) },
    error: null,
    pending: false,
    selectionOutOfSync: false,
    handleAccept: vi.fn(),
    handleReject: vi.fn(),
  });
}

describe("Inbox", () => {
  it("prompts for an active case when none is selected", () => {
    useSuspenseQueryMock.mockReturnValue({
      data: { cases: [], active: null },
    });

    render(<Inbox onProposalIdChange={vi.fn()} />);
    expect(screen.getByText("No Active Case")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Select a Case" })).toHaveAttribute(
      "href",
      "/cases"
    );
    expect(screen.queryByText("Inbox queue toolbar")).not.toBeInTheDocument();
    expect(useSuspenseQueryMock).toHaveBeenCalled();
  });

  it("renders queue chrome for the active case", () => {
    useSuspenseQueryMock.mockReturnValue({
      data: { cases: [ACTIVE], active: ACTIVE },
    });
    mockWorkspace();

    const client = new QueryClient();
    render(
      <QueryClientProvider client={client}>
        <Inbox proposalId={testId(50)} onProposalIdChange={vi.fn()} />
      </QueryClientProvider>
    );

    expect(screen.getByText("Inbox queue toolbar")).toBeInTheDocument();
    expect(screen.getByText("Inbox queue list")).toBeInTheDocument();
    expect(screen.getByText("Inbox detail panel")).toBeInTheDocument();
    expect(screen.getByTestId("split-list")).toBeInTheDocument();
    expect(screen.getByTestId("split-detail")).toBeInTheDocument();
    expect(useInboxWorkspaceMock).toHaveBeenCalled();
    expect(useSuspenseQueryMock).toHaveBeenCalled();
  });
});
