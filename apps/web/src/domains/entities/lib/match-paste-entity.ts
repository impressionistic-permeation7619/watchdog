import { IDENTIFIER_TYPES, type IdentifierType } from "@watchdog/schemas";

import type {
  IdentifierPasteEntity,
  IdentifierPasteTarget,
} from "./parse-identifier-paste.types";

export function isPinnedValueTarget(
  target: IdentifierPasteTarget
): target is IdentifierType {
  return (IDENTIFIER_TYPES as readonly string[]).includes(target);
}

export function cellForTarget(
  row: readonly string[],
  mapping: readonly IdentifierPasteTarget[],
  target: IdentifierPasteTarget
): string {
  const idx = mapping.indexOf(target);
  if (idx === -1) return "";
  return row[idx] ?? "";
}

export function valueTargets(
  mapping: readonly IdentifierPasteTarget[]
): { index: number; pinned: IdentifierType | null }[] {
  const out: { index: number; pinned: IdentifierType | null }[] = [];
  for (const [index, target] of mapping.entries()) {
    if (target === "value") out.push({ index, pinned: null });
    else if (isPinnedValueTarget(target)) out.push({ index, pinned: target });
  }
  return out;
}

export function matchPasteEntity(
  raw: string,
  entities: readonly IdentifierPasteEntity[],
  fallbackId: string
): { id: string; name: string } | { error: string } {
  const needle = raw.trim();
  if (needle === "") {
    if (fallbackId === "") return { error: "Entity is required" };
    const fallback = entities.find((e) => e.id === fallbackId);
    if (fallback === undefined) return { error: "Entity is required" };
    return { id: fallback.id, name: fallback.name };
  }

  const lower = needle.toLowerCase();
  const byName = entities.filter((e) => e.name.toLowerCase() === lower);
  if (byName.length > 1) return { error: "Entity is ambiguous" };
  if (byName.length === 1) {
    const [hit] = byName;
    return { id: hit.id, name: hit.name };
  }

  const bySlug = entities.filter((e) => e.slug.toLowerCase() === lower);
  if (bySlug.length > 1) return { error: "Entity is ambiguous" };
  if (bySlug.length === 1) {
    const [hit] = bySlug;
    return { id: hit.id, name: hit.name };
  }

  return { error: "Entity not found" };
}
