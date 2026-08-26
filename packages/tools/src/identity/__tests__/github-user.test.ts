import { describe, expect, it, vi } from "vitest";

import {
  fetchGithubUser,
  githubUserSnapshotSchema,
  normalizeGithubHandle,
} from "../github-user";

describe("github-user", () => {
  it("normalizeGithubHandle strips @ and validates login", () => {
    expect(normalizeGithubHandle("@OctoCat")).toBe("octocat");
    expect(() => normalizeGithubHandle("bad handle")).toThrow(/Invalid GitHub/);
  });

  it("fetchGithubUser maps 404 to found=false", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 404 }))
    );

    const snap = await fetchGithubUser(
      "missing-user",
      AbortSignal.timeout(5000)
    );

    expect(githubUserSnapshotSchema.parse(snap).found).toBe(false);
    expect(snap.status).toBe(404);
    vi.unstubAllGlobals();
  });
});
