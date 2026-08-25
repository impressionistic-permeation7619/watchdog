import { parseEdgePhraseValue } from "@/shared/ui/vocab/edge-predicate";

export interface ConnectionComposerValues {
  peerId: string;
  phraseValue: string;
  notes: string;
}

export function connectionComposerIssues(
  values: ConnectionComposerValues
): string | null {
  if (!values.peerId) return "Select a peer entity";
  const parsed = parseEdgePhraseValue(values.phraseValue);
  if (!parsed) return "Select a relationship";
  if (parsed.predicate === "related_to" && !values.notes.trim()) {
    return "related_to needs a short why (notes)";
  }
  return null;
}
