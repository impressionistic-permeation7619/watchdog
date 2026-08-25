import type { JsonValue } from "./json";
import { normalizeIdentifierValue } from "./normalize-identifier";
import type { PatchOp } from "./patch";
import { normalizeIdentifierPlatform } from "./platforms";

function str(v: JsonValue | undefined): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/**
 * Deterministic fingerprint for a PatchOp — used for known-finding
 * suppression and rejected-FP memory.
 */
export function fingerprintPatchOp(op: PatchOp): string | null {
  const d = op.data;
  switch (op.resource) {
    case "identifier": {
      const entityId = str(d.entityId);
      const type = str(d.type);
      const valueRaw = str(d.value);
      if (
        entityId === undefined ||
        type === undefined ||
        valueRaw === undefined
      )
        return null;
      const platform = normalizeIdentifierPlatform(str(d.platform) ?? "");
      const value = normalizeIdentifierValue(type, valueRaw);
      return `identifier|${entityId}|${type}|${platform}|${value}`;
    }
    case "claim": {
      const entityId = str(d.entityId);
      const text = str(d.text)?.toLowerCase();
      if (entityId === undefined || text === undefined) return null;
      return `claim|${entityId}|${text}`;
    }
    case "edge": {
      const fromId = str(d.fromId);
      const toId = str(d.toId);
      const predicate = str(d.predicate);
      if (fromId === undefined || toId === undefined || predicate === undefined)
        return null;
      return `edge|${fromId}|${toId}|${predicate}`;
    }
    case "question": {
      const entityId = str(d.entityId);
      const text = str(d.text)?.toLowerCase();
      if (entityId === undefined || text === undefined) return null;
      return `question|${entityId}|${text}`;
    }
    case "event": {
      const entityId = str(d.entityId);
      const when = str(d.when)?.toLowerCase();
      const what = str(d.what)?.toLowerCase();
      if (entityId === undefined || when === undefined || what === undefined)
        return null;
      return `event|${entityId}|${when}|${what}`;
    }
    case "entity": {
      const slug = str(d.slug)?.toLowerCase();
      if (slug === undefined) return null;
      return `entity|${slug}`;
    }
    default: {
      const _exhaustive: never = op.resource;
      void _exhaustive;
      return null;
    }
  }
}
