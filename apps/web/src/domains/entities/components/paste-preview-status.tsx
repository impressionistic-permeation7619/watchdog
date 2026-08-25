import { pasteEntityErrorLabel } from "@/domains/entities/lib/paste-entity-error-label";

export function PastePreviewStatus({ error }: { error: string | null }) {
  if (error === null) return null;
  const label = pasteEntityErrorLabel(error);
  return <p>{label ?? error}</p>;
}
