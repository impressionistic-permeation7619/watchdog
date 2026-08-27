import type { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";

import {
  GC_DEFAULT,
  GC_REALTIME,
  GC_STABLE,
  STALE_DEFAULT,
  STALE_REALTIME,
  STALE_STABLE,
} from "@/shared/lib/query-stale";

vi.mock("@/domains/jobs/jobs.functions", () => ({
  getArtifactContentFn: vi.fn(),
  getJobFn: vi.fn(),
  listCapabilitiesFn: vi.fn(),
  listJobsFn: vi.fn(),
  listPlaybooksFn: vi.fn(),
}));

vi.mock("@/shared/lib/query-invalidation", () => ({
  invalidateAfterJobMutation: vi.fn(),
}));

import {
  artifactContentQuery,
  capabilitiesListQuery,
  jobDetailQuery,
  jobsKeys,
  jobsListQuery,
  playbooksListQuery,
  refreshJobsAfterMutation,
} from "@/domains/jobs/queries";
import { invalidateAfterJobMutation } from "@/shared/lib/query-invalidation";

describe("jobs queries", () => {
  it("builds case-scoped job and artifact keys", () => {
    expect(jobsKeys.all("case-1")).toEqual(["jobs", "case-1"]);
    expect(jobsKeys.detail("case-1", "job-1")).toEqual([
      "jobs",
      "case-1",
      "detail",
      "job-1",
    ]);
    expect(
      jobsKeys.jobArtifact("case-1", "job-1", "abc", "text/plain")
    ).toEqual(["artifact", "job", "case-1", "job-1", "abc", "text/plain"]);
    expect(jobsKeys.evidenceArtifact("case-1", "ev-1", "text/plain")).toEqual([
      "artifact",
      "evidence",
      "case-1",
      "ev-1",
      "text/plain",
    ]);
  });

  it("uses realtime tiers for job lists and stable tiers for catalogs", () => {
    expect(jobsListQuery("case-1")).toMatchObject({
      queryKey: jobsKeys.all("case-1"),
      staleTime: STALE_REALTIME,
      gcTime: GC_REALTIME,
    });
    expect(jobDetailQuery("case-1", "job-1")).toMatchObject({
      queryKey: jobsKeys.detail("case-1", "job-1"),
      staleTime: STALE_REALTIME,
      gcTime: GC_REALTIME,
    });
    expect(capabilitiesListQuery()).toMatchObject({
      queryKey: ["capabilities"],
      staleTime: STALE_STABLE,
      gcTime: GC_STABLE,
    });
    expect(playbooksListQuery()).toMatchObject({
      queryKey: ["playbooks"],
      staleTime: STALE_STABLE,
      gcTime: GC_STABLE,
    });
  });

  it("enables artifact queries only when source ids are present", () => {
    expect(
      artifactContentQuery({
        source: "job",
        caseId: "case-1",
        jobId: "job-1",
        sha256: "",
        mime: "text/plain",
      })
    ).toMatchObject({ enabled: false });

    expect(
      artifactContentQuery({
        source: "job",
        caseId: "case-1",
        jobId: "job-1",
        sha256: "deadbeef",
        mime: "text/plain",
      })
    ).toMatchObject({
      enabled: true,
      queryKey: jobsKeys.jobArtifact(
        "case-1",
        "job-1",
        "deadbeef",
        "text/plain"
      ),
      staleTime: STALE_DEFAULT,
      gcTime: GC_DEFAULT,
      meta: { silentError: true },
    });

    expect(
      artifactContentQuery({
        source: "evidence",
        caseId: "case-1",
        evidenceId: "",
        mime: "text/plain",
      })
    ).toMatchObject({ enabled: false });

    expect(
      artifactContentQuery({
        source: "evidence",
        caseId: "case-1",
        evidenceId: "ev-1",
        mime: "text/plain",
      })
    ).toMatchObject({
      enabled: true,
      queryKey: jobsKeys.evidenceArtifact("case-1", "ev-1", "text/plain"),
    });
  });

  it("delegates refreshJobsAfterMutation to the shared invalidation contract", async () => {
    const client = {} as QueryClient;
    await refreshJobsAfterMutation(client, "case-1");
    expect(invalidateAfterJobMutation).toHaveBeenCalledWith(client, "case-1");
  });
});
