import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { testId } from "@watchdog/test-kit";

import { JobQueueToolbar } from "@/domains/jobs/components/job-queue-toolbar";
import { EMPTY_JOB_FILTERS } from "@/domains/jobs/lib/status";
import type { JobListRecord } from "@/domains/jobs/jobs.functions";

function job(overrides: Partial<JobListRecord> = {}): JobListRecord {
  return {
    id: testId(11),
    caseId: testId(10),
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
    ...overrides,
  };
}

describe("JobQueueToolbar", () => {
  it("renders job search and filter controls", () => {
    render(
      <JobQueueToolbar
        jobs={[job()]}
        filters={EMPTY_JOB_FILTERS}
        onFiltersChange={vi.fn()}
        runSlot={<div>Run slot</div>}
      />
    );

    expect(screen.getByLabelText("Search jobs")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Filters/ })).toBeInTheDocument();
    expect(screen.getByText("Run slot")).toBeInTheDocument();
  });
});
