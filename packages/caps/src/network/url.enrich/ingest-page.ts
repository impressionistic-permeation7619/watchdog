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

type IngestRemotePageOpts = {
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
};

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
  const step: StepResult = {
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

  const artifacts: CapArtifact[] = [];
  let text = "";
  let title: string | undefined;
  let urls: string[] = [];
  let emails: string[] = [];

  if (fetched.bytes.byteLength === 0) {
    log(`${label} failed: ${fetched.error ?? "empty"}`);
    return { step, text, urls, emails, artifacts };
  }

  if (isMarkdown(fetched.contentType)) {
    const md = decodeHtml(fetched.bytes).slice(0, 200_000);
    text = md;
    step.ok = fetched.ok;
    step.mdMethod = "native_markdown";
    urls = extractOutboundFromMarkdown(md);
    artifacts.push(
      await uploadArtifact({
        bytes: new TextEncoder().encode(md),
        mime: "text/markdown; charset=utf-8",
        name: `${label}.md`,
      })
    );
    log(
      `${label} native markdown status=${fetched.status} tokens~${fetched.markdownTokensHint ?? "?"}`
    );
    return { step, text, urls, emails, artifacts };
  }

  if (isHtml(fetched.contentType, fetched.bytes)) {
    artifacts.push(
      await uploadArtifact({
        bytes: fetched.bytes,
        mime: "text/html; charset=utf-8",
        name: `${label}.html`,
      })
    );
    const html = decodeHtml(fetched.bytes);
    title = extractTitle(html);
    text = htmlToText(html);
    step.ok = fetched.ok;
    step.mdMethod = "html_convert";
    const fromHtml = extractOutboundFromHtml(html, linkBaseUrl);
    urls = fromHtml.urls;
    emails = fromHtml.emails;
    artifacts.push(
      await uploadArtifact({
        bytes: new TextEncoder().encode(htmlToMarkdownish(html, title)),
        mime: "text/markdown; charset=utf-8",
        name: `${label}.md`,
      })
    );
    log(
      `${label} html→md status=${fetched.status} bytes=${fetched.bytes.byteLength} links=${fromHtml.urls.length}`
    );
    return {
      step,
      text,
      ...(title !== undefined && title !== "" ? { title } : {}),
      urls,
      emails,
      artifacts,
    };
  }

  if (allowPlainBinary) {
    artifacts.push(
      await uploadArtifact({
        bytes: fetched.bytes,
        mime:
          fetched.contentType?.split(";")[0]?.trim() ??
          "application/octet-stream",
        name: `${label}.bin`,
      })
    );
    text = decodeHtml(fetched.bytes).slice(0, 200_000);
    step.ok = fetched.ok;
    step.mdMethod = "plain_text";
    log(
      `${label} binary/text status=${fetched.status} bytes=${fetched.bytes.byteLength}`
    );
    return { step, text, urls, emails, artifacts };
  }

  step.error ??= "empty or non-HTML snapshot";
  log(`${label} fail: ${step.error}`);
  return { step, text, urls, emails, artifacts };
}
