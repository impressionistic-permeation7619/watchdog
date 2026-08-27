import type { CapArtifact } from "@watchdog/cap-sdk";
import {
  decodeHtml,
  extractOutboundFromHtml,
  extractOutboundFromMarkdown,
  extractTitle,
  htmlToMarkdownish,
  htmlToText,
  isHtml,
  isMarkdown,
} from "@watchdog/tools";

import { fetchBytes } from "./fetch-bytes";
import {
  ACCEPT_MARKDOWN_FIRST,
  type IngestResult,
  type StepResult,
} from "./types";

type UploadFn = (input: {
  bytes: Uint8Array;
  mime: string;
  name?: string;
}) => Promise<CapArtifact>;

interface IngestRemotePageOpts {
  fetchUrl: string;
  /** Base URL for resolving relative hrefs (usually the live page URL). */
  linkBaseUrl: string;
  signal: AbortSignal;
  label: "live" | "wayback";
  uploadArtifact: UploadFn;
  log: (message: string) => void;
  /** Live may keep opaque/binary as text; Wayback treats that as failure. */
  allowPlainBinary: boolean;
  stepExtras?: Partial<StepResult>;
}

type FetchedPage = Awaited<ReturnType<typeof fetchBytes>>;

interface IngestContext {
  fetched: FetchedPage;
  step: StepResult;
  label: IngestRemotePageOpts["label"];
  linkBaseUrl: string;
  uploadArtifact: UploadFn;
  log: IngestRemotePageOpts["log"];
}

function buildStep(
  fetched: FetchedPage,
  stepExtras?: Partial<StepResult>
): StepResult {
  return {
    ok: false,
    status: fetched.status,
    bytes: fetched.bytes.byteLength,
    contentType: fetched.contentType ?? undefined,
    mdMethod: "none",
    ...(fetched.markdownTokensHint === undefined
      ? {}
      : { markdownTokensHint: fetched.markdownTokensHint }),
    ...(fetched.error !== undefined && fetched.error !== ""
      ? { error: fetched.error }
      : {}),
    ...stepExtras,
  };
}

async function ingestMarkdownContent(
  ctx: IngestContext
): Promise<IngestResult> {
  const { fetched, step, label, uploadArtifact, log } = ctx;
  const md = decodeHtml(fetched.bytes).slice(0, 200_000);
  step.ok = fetched.ok;
  step.mdMethod = "native_markdown";
  const artifacts = [
    await uploadArtifact({
      bytes: new TextEncoder().encode(md),
      mime: "text/markdown; charset=utf-8",
      name: `${label}.md`,
    }),
  ];
  log(
    `${label} native markdown status=${fetched.status} tokens~${fetched.markdownTokensHint ?? "?"}`
  );
  return {
    step,
    text: md,
    urls: extractOutboundFromMarkdown(md),
    emails: [],
    artifacts,
  };
}

async function ingestHtmlContent(ctx: IngestContext): Promise<IngestResult> {
  const { fetched, step, label, linkBaseUrl, uploadArtifact, log } = ctx;
  const html = decodeHtml(fetched.bytes);
  const title = extractTitle(html);
  const text = htmlToText(html);
  const fromHtml = extractOutboundFromHtml(html, linkBaseUrl);
  step.ok = fetched.ok;
  step.mdMethod = "html_convert";
  const artifacts = [
    await uploadArtifact({
      bytes: fetched.bytes,
      mime: "text/html; charset=utf-8",
      name: `${label}.html`,
    }),
    await uploadArtifact({
      bytes: new TextEncoder().encode(htmlToMarkdownish(html, title)),
      mime: "text/markdown; charset=utf-8",
      name: `${label}.md`,
    }),
  ];
  log(
    `${label} html→md status=${fetched.status} bytes=${fetched.bytes.byteLength} links=${fromHtml.urls.length}`
  );
  return {
    step,
    text,
    ...(title !== undefined && title !== "" ? { title } : {}),
    urls: fromHtml.urls,
    emails: fromHtml.emails,
    artifacts,
  };
}

async function ingestPlainBinaryContent(
  ctx: IngestContext
): Promise<IngestResult> {
  const { fetched, step, label, uploadArtifact, log } = ctx;
  const text = decodeHtml(fetched.bytes).slice(0, 200_000);
  step.ok = fetched.ok;
  step.mdMethod = "plain_text";
  const artifacts = [
    await uploadArtifact({
      bytes: fetched.bytes,
      mime:
        fetched.contentType?.split(";")[0]?.trim() ??
        "application/octet-stream",
      name: `${label}.bin`,
    }),
  ];
  log(
    `${label} binary/text status=${fetched.status} bytes=${fetched.bytes.byteLength}`
  );
  return { step, text, urls: [], emails: [], artifacts };
}

export async function ingestRemotePage(
  opts: IngestRemotePageOpts
): Promise<IngestResult> {
  const {
    fetchUrl,
    linkBaseUrl,
    signal,
    label,
    uploadArtifact,
    log,
    allowPlainBinary,
    stepExtras,
  } = opts;

  const fetched = await fetchBytes(fetchUrl, signal, ACCEPT_MARKDOWN_FIRST);
  const step = buildStep(fetched, stepExtras);
  const empty: IngestResult = {
    step,
    text: "",
    urls: [],
    emails: [],
    artifacts: [],
  };

  if (fetched.bytes.byteLength === 0) {
    log(`${label} failed: ${fetched.error ?? "empty"}`);
    return empty;
  }

  const ctx: IngestContext = {
    fetched,
    step,
    label,
    linkBaseUrl,
    uploadArtifact,
    log,
  };

  if (isMarkdown(fetched.contentType)) {
    return ingestMarkdownContent(ctx);
  }
  if (isHtml(fetched.contentType, fetched.bytes)) {
    return ingestHtmlContent(ctx);
  }
  if (allowPlainBinary) {
    return ingestPlainBinaryContent(ctx);
  }

  step.error ??= "empty or non-HTML snapshot";
  log(`${label} fail: ${step.error}`);
  return empty;
}
