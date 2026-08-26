import { z } from "zod";

import { isRecord } from "../parse/coerce";
import {
  httpToolsError,
  parseToolsError,
  validationToolsError,
} from "../errors/tools-error";

export const githubUserSnapshotSchema = z.object({
  handle: z.string().min(1),
  queriedAt: z.string().min(1),
  found: z.boolean(),
  url: z.string().nullable(),
  name: z.string().nullable(),
  bio: z.string().nullable(),
  blog: z.string().nullable(),
  location: z.string().nullable(),
  company: z.string().nullable(),
  publicRepos: z.number().int().nullable(),
  followers: z.number().int().nullable(),
  createdAt: z.string().nullable(),
  status: z.number().int().nullable(),
  authenticated: z.boolean(),
});

export type GithubUserSnapshot = z.infer<typeof githubUserSnapshotSchema>;

/** Strip @ and lowercase GitHub login. */
export function normalizeGithubHandle(raw: string): string {
  const h = raw.trim().replace(/^@/, "").toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9])){0,38}$/i.test(h)) {
    throw validationToolsError(`Invalid GitHub handle: ${raw}`);
  }
  return h;
}

/**
 * GitHub user profile via REST API.
 * Optional token raises rate limits; unauthenticated still works (public).
 */
export async function fetchGithubUser(
  handleRaw: string,
  signal: AbortSignal,
  options?: { token?: string; userAgent?: string }
): Promise<GithubUserSnapshot> {
  const handle = normalizeGithubHandle(handleRaw);
  const ua =
    options?.userAgent ?? "Watchdog/1.0 (+identity.github.lookup; OSINT)";
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": ua,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = options?.token?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`https://api.github.com/users/${handle}`, {
    method: "GET",
    signal,
    headers,
  });

  if (res.status === 404) {
    return githubUserSnapshotSchema.parse({
      handle,
      queriedAt: new Date().toISOString(),
      found: false,
      url: null,
      name: null,
      bio: null,
      blog: null,
      location: null,
      company: null,
      publicRepos: null,
      followers: null,
      createdAt: null,
      status: 404,
      authenticated: Boolean(token),
    });
  }

  if (!res.ok) {
    throw httpToolsError(
      "GitHub API",
      res.status,
      `GitHub API ${res.status} for ${handle}`
    );
  }

  const body: unknown = await res.json();
  if (!isRecord(body)) {
    throw parseToolsError("GitHub", handle);
  }
  return githubUserSnapshotSchema.parse({
    handle,
    queriedAt: new Date().toISOString(),
    found: true,
    url:
      typeof body.html_url === "string"
        ? body.html_url
        : `https://github.com/${handle}`,
    name: typeof body.name === "string" ? body.name : null,
    bio: typeof body.bio === "string" ? body.bio : null,
    blog: typeof body.blog === "string" && body.blog !== "" ? body.blog : null,
    location: typeof body.location === "string" ? body.location : null,
    company: typeof body.company === "string" ? body.company : null,
    publicRepos:
      typeof body.public_repos === "number" ? body.public_repos : null,
    followers: typeof body.followers === "number" ? body.followers : null,
    createdAt: typeof body.created_at === "string" ? body.created_at : null,
    status: res.status,
    authenticated: Boolean(token),
  });
}
