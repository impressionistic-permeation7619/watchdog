import type { EvidenceKind } from "@watchdog/schemas";

/** Case Evidence option for pickers / composers (parent owns fetch). */
export interface EvidenceOption {
  id: string;
  kind: EvidenceKind;
  label?: string | null;
  sourceUrl?: string | null;
  sha256?: string | null;
}
