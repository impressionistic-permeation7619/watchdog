/**
 * Syntax-highlighted code block using Shiki.
 * Uses github-dark / github-light matched to the current app theme.
 * Shiki runs once per (code, lang, theme) combo; singleton highlighter cached.
 */
import { useEffect, useState } from "react";
import type { createHighlighter } from "shiki";

import { cn } from "@/lib/utils";

// ─── shiki singleton ──────────────────────────────────────────────────────────

type Highlighter = Awaited<ReturnType<typeof createHighlighter>>;

let highlighterPromise: Promise<Highlighter> | null = null;

async function getHighlighter(): Promise<Highlighter> {
  highlighterPromise ??= (async () => {
    const { createHighlighter } = await import("shiki");
    return createHighlighter({
      themes: ["tokyo-night", "github-light"],
      langs: ["json", "bash", "text", "xml", "yaml", "html"],
    });
  })();
  return highlighterPromise;
}

// ─── language detection ───────────────────────────────────────────────────────

type ShikiLang = "json" | "bash" | "text" | "xml" | "yaml" | "html";

function detectLang(mime: string, content: string): ShikiLang {
  if (mime.includes("json")) return "json";
  if (mime.includes("xml") || mime.includes("html")) return "xml";
  if (mime.includes("yaml")) return "yaml";
  if (mime.startsWith("text/x-sh") || mime.includes("shell")) return "bash";
  const trimmed = content.trimStart();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json";
  if (trimmed.startsWith("<")) return "xml";
  return "text";
}

// ─── component ───────────────────────────────────────────────────────────────

interface CodeBlockProps {
  code: string;
  mime?: string;
  lang?: ShikiLang;
  className?: string;
  maxHeight?: string;
}

export function CodeBlock({
  code,
  mime = "",
  lang,
  className,
  maxHeight = "60vh",
}: CodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null);

  const isDark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  const shikiTheme = isDark ? "tokyo-night" : "github-light";

  useEffect(() => {
    const language = lang ?? detectLang(mime, code);
    let cancelled = false;
    void (async () => {
      try {
        const hl = await getHighlighter();
        if (cancelled) return;
        const result = hl.codeToHtml(code, {
          lang: language,
          theme: shikiTheme,
        });
        if (!cancelled) setHtml(result);
      } catch {
        if (!cancelled) setHtml(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, mime, lang, shikiTheme]);

  if (html === null) {
    return (
      <pre
        className={cn(
          "bg-muted/40 overflow-auto rounded-md p-3 font-mono text-[11px] leading-relaxed break-words whitespace-pre-wrap",
          className
        )}
        style={{ maxHeight }}
      >
        {code}
      </pre>
    );
  }

  return (
    <div
      className={cn(
        "overflow-auto rounded-md text-[11px] leading-relaxed",
        "[&_.shiki]:!bg-muted/40 [&_.shiki]:rounded-md [&_.shiki]:p-3",
        "[&_code]:font-mono [&_code]:text-[11px] [&_code]:break-words [&_code]:whitespace-pre-wrap",
        className
      )}
      style={{ maxHeight }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
