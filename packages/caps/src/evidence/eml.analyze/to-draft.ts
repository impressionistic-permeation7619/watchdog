import type { ProcessExtractDraft } from "@watchdog/ai";
import type { EmlAnalyzeSnapshot } from "@watchdog/tools";

export function emlAnalyzeToDraft(
  snap: EmlAnalyzeSnapshot
): ProcessExtractDraft {
  const identifiers: ProcessExtractDraft["identifiers"] = [
    ...snap.emails.map((value) => ({
      type: "email" as const,
      value,
    })),
    ...snap.urls.map((value) => ({
      type: "url" as const,
      value,
    })),
  ];
  const claims: ProcessExtractDraft["claims"] = [
    {
      text: `EML From=${snap.from ?? "?"} Subject=${snap.subject ?? "?"} Message-Id=${snap.messageId ?? "?"}`,
    },
  ];
  if (snap.receivedChain.length) {
    claims.push({
      text: `Received chain (${snap.receivedChain.length} hop(s)): ${snap.receivedChain[0]?.slice(0, 200) ?? ""}`,
    });
  }
  return {
    summary: `Analyzed EML (${identifiers.length} identifier(s))`,
    identifiers,
    claims,
    questions: [],
  };
}
