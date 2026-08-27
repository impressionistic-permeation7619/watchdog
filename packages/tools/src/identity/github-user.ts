import { z } from "zod";

import { asString, isRecord } from "../parse/coerce";
import {
  httpToolsError,
  parseToolsError,
  validationToolsError,
} from "../errors/tools-error";
import { watchdogUserAgent } from "../errors/user-agent";

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

type GithubUserOptions = { token?: string; userAgent?: string };

function notFoundGithubSnapshot(
  handle: string,
  authenticated: boolean
): GithubUserSnapshot {
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
    authenticated,
  });
}

function githubUserFromBody(
  handle: string,
  body: Record<string, unknown>,
  status: number,
  authenticated: boolean
): GithubUserSnapshot {
  const blog = asString(body.blog);
  return githubUserSnapshotSchema.parse({
    handle,
    queriedAt: new Date().toISOString(),
    found: true,
    url: asString(body.html_url) ?? `https://github.com/${handle}`,
    name: asString(body.name),
    bio: asString(body.bio),
    blog: blog ?? null,
    location: asString(body.location),
    company: asString(body.company),
    publicRepos:
      typeof body.public_repos === "number" ? body.public_repos : null,
    followers: typeof body.followers === "number" ? body.followers : null,
    createdAt: asString(body.created_at),
    status,
    authenticated,
  });
}

export async function fetchGithubUser(
  handleRaw: string,
  signal: AbortSignal,
  options?: GithubUserOptions
): Promise<GithubUserSnapshot> {
  const handle = normalizeGithubHandle(handleRaw);
  const ua =
    options?.userAgent ?? watchdogUserAgent("identity.github.lookup");
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": ua,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = options?.token?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;
  const authenticated = Boolean(token);

  const res = await fetch(`https://api.github.com/users/${handle}`, {
    method: "GET",
    signal,
    headers,
  });

  if (res.status === 404) {
    return notFoundGithubSnapshot(handle, authenticated);
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
  return githubUserFromBody(handle, body, res.status, authenticated);
}
