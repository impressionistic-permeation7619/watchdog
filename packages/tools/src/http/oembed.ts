import { z } from "zod";

import { fetchBytes } from "./fetch-bytes";

export const OEMBED_VENDORS = [
  "youtube",
  "vimeo",
  "flickr",
  "soundcloud",
  "tiktok",
  "spotify",
] as const;

export type OembedVendor = (typeof OEMBED_VENDORS)[number];

export const oembedSnapshotSchema = z.object({
  url: z.string().min(1),
  queriedAt: z.string().min(1),
  vendor: z.enum(OEMBED_VENDORS).nullable(),
  title: z.string().nullable(),
  authorName: z.string().nullable(),
  authorUrl: z.string().nullable(),
  providerName: z.string().nullable(),
  thumbnailUrl: z.string().nullable(),
  type: z.string().nullable(),
  error: z.string().optional(),
});

export type OembedSnapshot = z.infer<typeof oembedSnapshotSchema>;

const HOST_SUFFIX: Record<OembedVendor, readonly string[]> = {
  youtube: ["youtube.com", "youtu.be", "youtube-nocookie.com"],
  vimeo: ["vimeo.com"],
  flickr: ["flickr.com", "flic.kr"],
  soundcloud: ["soundcloud.com"],
  tiktok: ["tiktok.com"],
  spotify: ["spotify.com"],
};

const oembedJsonSchema = z.object({
  title: z.string().optional(),
  author_name: z.string().optional(),
  author_url: z.string().optional(),
  provider_name: z.string().optional(),
  thumbnail_url: z.string().optional(),
  type: z.string().optional(),
});

function hostMatches(hostname: string, suffix: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return host === suffix || host.endsWith(`.${suffix}`);
}

export function matchOembedVendor(url: string): OembedVendor | null {
  try {
    const host = new URL(url).hostname;
    for (const vendor of OEMBED_VENDORS) {
      if (HOST_SUFFIX[vendor].some((suffix) => hostMatches(host, suffix))) {
        return vendor;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function isOembedUrl(url: string): boolean {
  return matchOembedVendor(url) !== null;
}

function oembedEndpoint(vendor: OembedVendor, url: string): string {
  const encoded = encodeURIComponent(url);
  switch (vendor) {
    case "youtube": {
      return `https://www.youtube.com/oembed?format=json&url=${encoded}`;
    }
    case "vimeo": {
      return `https://vimeo.com/api/oembed.json?url=${encoded}`;
    }
    case "flickr": {
      return `https://www.flickr.com/services/oembed?format=json&url=${encoded}`;
    }
    case "soundcloud": {
      return `https://soundcloud.com/oembed?format=json&url=${encoded}`;
    }
    case "tiktok": {
      return `https://www.tiktok.com/oembed?url=${encoded}`;
    }
    case "spotify": {
      return `https://open.spotify.com/oembed?url=${encoded}`;
    }
    default: {
      const _exhaustive: never = vendor;
      return _exhaustive;
    }
  }
}

function emptySnap(
  url: string,
  queriedAt: string,
  error: string,
  vendor: OembedVendor | null = null
): OembedSnapshot {
  return {
    url,
    queriedAt,
    vendor,
    title: null,
    authorName: null,
    authorUrl: null,
    providerName: null,
    thumbnailUrl: null,
    type: null,
    error,
  };
}

const MAX_OEMBED_BYTES = 64_000;

export async function fetchOembed(
  url: string,
  signal: AbortSignal,
  options: { userAgent: string }
): Promise<OembedSnapshot> {
  const queriedAt = new Date().toISOString();
  const vendor = matchOembedVendor(url);
  if (vendor === null) {
    return emptySnap(url, queriedAt, "Unsupported oEmbed host");
  }
  const endpoint = oembedEndpoint(vendor, url);
  const res = await fetchBytes(endpoint, signal, {
    userAgent: options.userAgent,
    maxBytes: MAX_OEMBED_BYTES,
    accept: "application/json",
  });
  if (!res.ok) {
    return emptySnap(url, queriedAt, res.error ?? `HTTP ${res.status}`, vendor);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(res.bytes));
  } catch {
    return emptySnap(url, queriedAt, "Invalid oEmbed JSON", vendor);
  }
  const json = oembedJsonSchema.safeParse(parsed);
  if (!json.success) {
    return emptySnap(url, queriedAt, "Unexpected oEmbed JSON shape", vendor);
  }
  return {
    url,
    queriedAt,
    vendor,
    title: json.data.title ?? null,
    authorName: json.data.author_name ?? null,
    authorUrl: json.data.author_url ?? null,
    providerName: json.data.provider_name ?? null,
    thumbnailUrl: json.data.thumbnail_url ?? null,
    type: json.data.type ?? null,
  };
}
