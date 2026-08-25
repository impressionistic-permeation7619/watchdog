export function pasteEntityErrorLabel(error: string | null): string | null {
  if (error === "Entity not found") return "Not found";
  if (error === "Entity is ambiguous" || error === "Ambiguous entity") {
    return "Ambiguous";
  }
  return null;
}
