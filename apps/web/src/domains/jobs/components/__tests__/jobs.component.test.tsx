import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { testId } from "@watchdog/test-kit";

import type { CaseRecord } from "@/domains/cases/types";

vi.mock("@/auth/server", () => ({
  auth: {},
}));

vi.mock("@/shared/layout/page", () => ({
  PageHeader: ({ actions }: { actions?: React.ReactNode }) => (
    <div>
      <div>Jobs page header</div>
      {actions}
    </div>
  ),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
  Navigate: () => null,
}));

vi.mock("@/domains/jobs/components/job-cap-run-form", () => ({
  JobCapRunForm: () => <div>Cap run form</div>,
}));

vi.mock("@/domains/jobs/components/job-playbook-run-form", () => ({
  JobPlaybookRunForm: () => <div>Playbook run form</div>,
}));

vi.mock("@/domains/jobs/components/job-detail", () => ({
  JobDetail: () => <div>Job detail panel</div>,
}));

vi.mock("@/domains/jobs/components/job-queue-list", () => ({
  JobQueueList: () => <div>Job queue list</div>,
}));

vi.mock("@/domains/jobs/components/job-queue-toolbar", () => ({
  JobQueueToolbar: ({
    runSlot,
  }: {
    runSlot?: React.ReactNode;
  }) => (
    <div>
      <div>Job queue toolbar</div>
      {runSlot}
    </div>
  ),
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
const useJobsWorkspaceMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useSuspenseQuery: (...args: unknown[]) => useSuspenseQueryMock(...args),
  };
});

vi.mock("@/domains/jobs/hooks/use-jobs-workspace", () => ({
  useJobsWorkspace: (...args: unknown[]) => useJobsWorkspaceMock(...args),
}));

vi.mock("@/shared/lib/query-invalidation", () => ({
  bindCasesChangedInvalidation: vi.fn(),
}));

import { Jobs } from "@/domains/jobs/components/jobs";

const ACTIVE: CaseRecord = {
  id: testId(10),
  slug: "alpha",
  name: "Alpha",
  description: null,
  allowThirdPartyEgress: false,
};

function mockQueries() {
  useSuspenseQueryMock.mockImplementation((options: { queryKey?: unknown[] }) => {
    const key = options.queryKey?.[0];
    if (key === "cases") {
      return { data: { active: ACTIVE, cases: [ACTIVE] } };
    }
    if (key === "capabilities") {
      return { data: [] };
    }
    if (key === "playbooks") {
      return { data: [] };
    }
    if (key === "entities") {
      return { data: [] };
    }
    if (key === "evidence") {
      return { data: [] };
    }
    if (key === "credentials") {
      return { data: [] };
    }
    if (key === "jobs") {
      return {
        data: [
          {
            id: testId(11),
            caseId: ACTIVE.id,
            capabilityId: "network.dns.lookup",
            status: "queued",
            input: { host: "mailhost.test" },
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z",
            startedAt: null,
            finishedAt: null,
            error: null,
            interpretError: null,
            proposalId: null,
            resultSummary: null,
            fromCache: false,
            suppressedCount: 0,
            playbookRunId: null,
            playbookId: null,
            playbookRunStatus: null,
            playbookStep: null,
            evidenceIds: [],
            output: [],
            actorId: "test-actor",
            playbookFanIndex: 0,
          },
        ],
        isFetching: false,
      };
    }
    return { data: [] };
  });
}

function mockWorkspace() {
  useJobsWorkspaceMock.mockReturnValue({
    selectedId: testId(11),
    detailJob: { id: testId(11) },
    runSiblings: [],
    cancelBusy: false,
    cancelPlaybookBusy: false,
    handleCancel: vi.fn(),
    handleCancelPlaybook: vi.fn(),
    handleRunCap: vi.fn(),
    handleRunPlaybook: vi.fn(),
    hasPlaybookRun: false,
    stuckJobs: [],
    error: null,
    selectionOutOfSync: false,
  });
}

describe("Jobs", () => {
  it("shows no active case copy when nothing is selected", () => {
    useSuspenseQueryMock.mockReturnValue({
      data: { active: null, cases: [] },
    });

    render(
      <QueryClientProvider client={new QueryClient()}>
        <Jobs onJobIdChange={vi.fn()} />
      </QueryClientProvider>
    );

    expect(screen.getByText("No Active Case")).toBeInTheDocument();
    expect(screen.getByText("Select a Case")).toBeInTheDocument();
  });

  it("renders jobs workspace chrome when a case is active", () => {
    mockQueries();
    mockWorkspace();

    render(
      <QueryClientProvider client={new QueryClient()}>
        <Jobs jobId={testId(11)} onJobIdChange={vi.fn()} />
      </QueryClientProvider>
    );

    expect(screen.getByText("Jobs page header")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Run mode" })).toBeInTheDocument();
    expect(screen.getByText("Job queue toolbar")).toBeInTheDocument();
    expect(screen.getByText("Cap run form")).toBeInTheDocument();
    expect(screen.getByText("Job queue list")).toBeInTheDocument();
    expect(screen.getByText("Job detail panel")).toBeInTheDocument();
  });
});
