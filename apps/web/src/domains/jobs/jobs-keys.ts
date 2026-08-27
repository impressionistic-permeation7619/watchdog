export const jobsKeys = {
  all: (caseId: string) => ["jobs", caseId] as const,
  detail: (caseId: string, jobId: string) =>
    ["jobs", caseId, "detail", jobId] as const,
  jobArtifact: (caseId: string, jobId: string, sha256: string, mime: string) =>
    ["artifact", "job", caseId, jobId, sha256, mime] as const,
  evidenceArtifact: (caseId: string, evidenceId: string, mime: string) =>
    ["artifact", "evidence", caseId, evidenceId, mime] as const,
};
