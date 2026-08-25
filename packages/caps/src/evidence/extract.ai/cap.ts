import {
  createWatchdogModel,
  processExtractDraftSchema,
  structuredExtract,
  type EvidenceSnapshot,
  type LlmProviderConfig,
} from "@watchdog/ai";
import { defineCapability } from "@watchdog/cap-sdk";
import {
  EVIDENCE_EXTRACT_AI_CAPABILITY_ID,
  IDENTIFIER_PLATFORM_SLUGS,
  trimmedOrUndefined,
} from "@watchdog/schemas";

import {
  interpretProcessDraft,
  uploadProcessArtifacts,
} from "../lib/process-shared";
import { evidenceExtractAiInput } from "./input";

/**
 * Cap-owned extract instructions (kept local until a second consumer needs a shared store).
 * Schema enforcement is via processExtractDraftSchema — this text steers quality.
 */
function buildMessages(snapshot: EvidenceSnapshot): {
  system: string;
  prompt: string;
} {
  const system = [
    "You are Watchdog's Evidence extract assistant for OSINT investigators.",
    "Your job: pull structured identifiers, factual claims, and open questions from ONE Evidence blob so a human can Accept them into the Graph.",
    "",
    "Grounding (hard rules):",
    '- Use ONLY text inside the Evidence delimiters. No outside knowledge, DNS, WHOIS, breach DBs, or "everyone knows".',
    "- Never invent people, orgs, emails, handles, IPs, domains, dates, or links that are not written in the Evidence.",
    "- Meta lines (kind/label/mime) describe the capture — they are not extra facts to invent from.",
    "- Prefer a short evidenceQuote (verbatim span) on every identifier/claim/question when the source span is clear.",
    "- If the Evidence is empty, boilerplate, or useless: empty arrays + a one-line summary saying so.",
    "",
    "What goes where:",
    "- identifiers: concrete addressable values. type MUST be one of: email | handle | phone | url | crypto | credential | other.",
    "  email = full addresses; handle = usernames/@handles; phone = numbers as written;",
    '  url = http(s) links and bare domains that appear as hosts; crypto = wallet/addresses; credential = password/hash/token ONLY if present as a value (do not "interpret" passwords);',
    "  other = IPs, names-as-labels, or values that do not fit the above — put a brief notes hint.",
    `  platform: for type=handle (and email/crypto when useful), prefer a known slug: ${IDENTIFIER_PLATFORM_SLUGS.join(", ")}.`,
    "  If the site is not in that list, invent a short lowercase custom slug (e.g. boy_moment). Omit when unknown.",
    "  Map aliases to known slugs (X→twitter, ig→instagram, tg→telegram). Do not invent platforms not in the Evidence.",
    '  status: current | former | unknown — only when Evidence says so (e.g. "former Discord"); otherwise omit.',
    "- claims: short factual observations grounded in the text (one idea each). class defaults to observation; use allegation only when the text itself alleges; avoid assessment/motive/psychology.",
    "- questions: unresolved ambiguities, conflicts, or things that need verification — prefer questions over weak claims.",
    "",
    "Do NOT:",
    "- Emit confidence, Graph UUIDs, entity ids, or patch ops.",
    "- Duplicate the same identifier (same type+platform+value); normalize email casing; keep handles as written.",
    '- Turn speculative links ("probably the same person") into claims — make them questions.',
    "- Geocode IPs or assert household/attribution from co-occurrence alone — question it.",
    "- Pad with filler claims restating the whole document.",
    "",
    "summary: one short sentence of what was extracted (or why nothing was).",
  ].join("\n");

  const meta: string[] = [`kind: ${snapshot.kind}`];
  const trimmedLabel = snapshot.label?.trim();
  if (trimmedLabel !== undefined && trimmedLabel !== "")
    meta.push(`label: ${trimmedLabel}`);
  const trimmedMime = snapshot.mime?.trim();
  if (trimmedMime !== undefined && trimmedMime !== "")
    meta.push(`mime: ${trimmedMime}`);

  const prompt = [
    "Extract from the Evidence below into identifiers[], claims[], questions[], and optional summary.",
    "Stay inside the delimiters. Empty arrays are OK.",
    "",
    "### Evidence meta ###",
    meta.join("\n"),
    "### Evidence ###",
    snapshot.text,
    "### End Evidence ###",
  ].join("\n");

  return { system, prompt };
}

async function resolveProvider(
  ctx: {
    getCredential: (name: string) => Promise<string>;
    hasCredential: (name: string) => Promise<boolean>;
  },
  modelOverride?: string
): Promise<LlmProviderConfig> {
  // Preflight already ensured one of these exists — pick without swallowing
  // vault decrypt / master-key errors.
  if (await ctx.hasCredential("ANTHROPIC_API_KEY")) {
    const apiKey = await ctx.getCredential("ANTHROPIC_API_KEY");
    return {
      kind: "anthropic",
      apiKey,
      model: trimmedOrUndefined(modelOverride) ?? "claude-sonnet-4-20250514",
    };
  }
  if (await ctx.hasCredential("AI_COMPAT_API_KEY")) {
    const apiKey = await ctx.getCredential("AI_COMPAT_API_KEY");
    const baseUrl = (await ctx.hasCredential("AI_COMPAT_BASE_URL"))
      ? await ctx.getCredential("AI_COMPAT_BASE_URL")
      : "http://127.0.0.1:8080/v1";
    return {
      kind: "openai_compat",
      baseUrl,
      apiKey,
      model: trimmedOrUndefined(modelOverride) ?? "default",
    };
  }
  throw new Error(
    "Missing LLM credential — set ANTHROPIC_API_KEY or AI_COMPAT_API_KEY (+ optional AI_COMPAT_BASE_URL) in Settings"
  );
}

export const evidenceExtractAi = defineCapability({
  id: EVIDENCE_EXTRACT_AI_CAPABILITY_ID,
  version: "1",
  title: "Extract Evidence (AI)",
  description:
    "LLM structured extract of identifiers, claims, and questions from held Evidence text when deterministic harvest is too shallow.",
  dataSource: "LLM structured extract",
  formOmit: ["entityId", "model"],
  input: evidenceExtractAiInput,
  timeoutMs: 120_000,
  kind: "process",
  flags: ["needs_key", "third_party", "slow"],
  egress: "third_party",
  consumes: [{ kind: "evidence", evidenceKind: "file" }],
  produces: [
    { kind: "identifier", type: "email" },
    { kind: "identifier", type: "handle" },
    { kind: "identifier", type: "url" },
  ],
  credentials: [
    { anyOf: ["ANTHROPIC_API_KEY", "AI_COMPAT_API_KEY"] },
    { name: "AI_COMPAT_BASE_URL", optional: true },
  ],
  jobPolicy: {
    needsEvidenceSnapshot: true,
    linkEvidenceFromInput: ["evidenceId"],
    markEvidenceProcessed: true,
  },
  async run(ctx) {
    const snapshot = ctx.evidenceSnapshot;
    if (!snapshot) {
      throw new Error("EvidenceSnapshot missing — packer did not run");
    }
    if (!snapshot.text.trim()) {
      const empty = processExtractDraftSchema.parse({
        identifiers: [],
        claims: [],
        questions: [],
        summary: "Empty Evidence text — skipped LLM",
      });
      return {
        artifacts: await uploadProcessArtifacts(
          ctx.uploadArtifact,
          snapshot,
          empty
        ),
      };
    }

    const provider = await resolveProvider(ctx, ctx.input.model);
    ctx.log(`AI extract via ${provider.kind} model=${provider.model}`);
    const model = createWatchdogModel(provider);
    const { system, prompt } = buildMessages(snapshot);
    const { object: draft, usage } = await structuredExtract({
      model,
      schema: processExtractDraftSchema,
      instructions: system,
      prompt,
      abortSignal: ctx.signal,
      temperature: 0,
    });
    if (usage) {
      ctx.log(
        `usage tokens in=${usage.inputTokens ?? "?"} out=${usage.outputTokens ?? "?"}`
      );
    }

    return {
      artifacts: await uploadProcessArtifacts(
        ctx.uploadArtifact,
        snapshot,
        draft
      ),
    };
  },
  interpret(report, opts) {
    return interpretProcessDraft(report, opts, {
      noEntity:
        "AI extract found signal but no Entity attached — attach Entity and re-Process",
      empty: "AI extract produced no identifiers/claims/questions",
    });
  },
});
