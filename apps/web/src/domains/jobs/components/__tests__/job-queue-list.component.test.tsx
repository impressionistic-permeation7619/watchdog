import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { testId } from "@watchdog/test-kit";

import { JobQueueList } from "@/domains/jobs/components/job-queue-list";
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

describe("JobQueueList", () => {
  it("renders grouped solo job rows in the listbox", () => {
    const row = job();

    render(
      <JobQueueList
        jobs={[row]}
        selectedId={row.id}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByRole("listbox", { name: "Job runs" })).toBeInTheDocument();
    expect(screen.getByRole("option", { selected: true })).toBeInTheDocument();
    expect(screen.getByText("mailhost.test")).toBeInTheDocument();
  });
});
