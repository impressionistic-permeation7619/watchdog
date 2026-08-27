import {
  EDGE_PREDICATES,
  EDGE_PREDICATE_GROUPS,
  EDGE_PREDICATE_GROUP_LABELS,
  EDGE_PREDICATE_META,
  edgePhraseValue,
  edgePredicateAllowsKinds,
  isEdgePredicate,
  parseEdgePhraseValue,
  predicateLabel as schemaPredicateLabel,
  type EdgeDirection,
  type EdgeOrientation,
  type EdgePredicate,
  type EntityKind,
} from "@watchdog/schemas";

import { titleCase } from "./title-case";

export {
  EDGE_PREDICATE_META,
  edgePhraseValue,
  parseEdgePhraseValue,
  type EdgeDirection,
  type EdgeOrientation,
};

/** Direction-aware display; unknown strings title-cased. */
export function predicateLabel(
  predicate: string,
  direction: EdgeDirection = "out"
): string {
  if (isEdgePredicate(predicate)) {
    return schemaPredicateLabel(predicate, direction);
  }
  return titleCase(predicate);
}

export interface EdgePhraseOption {
  /** Stable option id: `${predicate}:${orientation}` */
  value: string;
  label: string;
  /** Semantic Combobox group heading. */
  group: string;
  predicate: EdgePredicate;
  /** forward = current entity is subject; inverse = current entity is object */
  orientation: EdgeOrientation;
}

function allowsPair(
  predicate: EdgePredicate,
  fromKind: EntityKind | undefined,
  toKind: EntityKind | undefined
): boolean {
  if (fromKind === undefined || toKind === undefined) return true;
  return edgePredicateAllowsKinds(predicate, fromKind, toKind);
}

const GROUP_RANK = new Map(
  EDGE_PREDICATE_GROUPS.map((g, i) => [g, i] as const)
);

/**
 * Combined phrase options for create framing.
 * Symmetric predicates appear once (forward only).
 * Ordered by semantic group, then predicate enum order.
 */
export function edgePhraseOptions(opts?: {
  fromKind?: EntityKind;
  toKind?: EntityKind;
}): EdgePhraseOption[] {
  const fromKind = opts?.fromKind;
  const toKind = opts?.toKind;
  const out: EdgePhraseOption[] = [];

  for (const predicate of EDGE_PREDICATES) {
    const meta = EDGE_PREDICATE_META[predicate];
    const groupLabel = EDGE_PREDICATE_GROUP_LABELS[meta.group];

    if (allowsPair(predicate, fromKind, toKind)) {
      out.push({
        value: edgePhraseValue(predicate, "forward"),
        label: meta.label,
        group: groupLabel,
        predicate,
        orientation: "forward",
      });
    }

    if (meta.symmetric) continue;

    if (allowsPair(predicate, toKind, fromKind)) {
      out.push({
        value: edgePhraseValue(predicate, "inverse"),
        label: meta.inverseLabel,
        group: groupLabel,
        predicate,
        orientation: "inverse",
      });
    }
  }

  out.sort((a, b) => {
    const ga = GROUP_RANK.get(EDGE_PREDICATE_META[a.predicate].group) ?? 0;
    const gb = GROUP_RANK.get(EDGE_PREDICATE_META[b.predicate].group) ?? 0;
    if (ga !== gb) return ga - gb;
    return (
      EDGE_PREDICATES.indexOf(a.predicate) -
      EDGE_PREDICATES.indexOf(b.predicate)
    );
  });
  return out;
}

type PreferredPair = readonly [EdgePredicate, EdgeOrientation];

const PREFERRED_BY_KIND_PAIR: Partial<
  Record<`${EntityKind}:${EntityKind}`, PreferredPair>
> = {
  "org:infra": ["primary_domain", "forward"],
  "infra:org": ["primary_domain", "inverse"],
  "org:org": ["parent_of", "forward"],
  "infra:infra": ["parent_of", "forward"],
};

/**
 * Kind-pair smart default for connection pickers.
 * Falls back to the first valid `edgePhraseOptions` entry.
 */
export function preferredEdgePhrase(
  centerKind: EntityKind,
  peerKind: EntityKind
): EdgePhraseOption | null {
  const options = edgePhraseOptions({
    fromKind: centerKind,
    toKind: peerKind,
  });
  if (options.length === 0) return null;

  const preferred = PREFERRED_BY_KIND_PAIR[`${centerKind}:${peerKind}`];
  if (preferred) {
    const value = edgePhraseValue(preferred[0], preferred[1]);
    const hit = options.find((o) => o.value === value);
    if (hit) return hit;
  }
  return options[0] ?? null;
}

/**
 * Keep current phrase if still valid for the kind pair; else preferred (then first).
 */
export function clampEdgePhrase(
  centerKind: EntityKind,
  peerKind: EntityKind,
  predicate: EdgePredicate,
  orientation: EdgeOrientation
): { predicate: EdgePredicate; orientation: EdgeOrientation } {
  const options = edgePhraseOptions({
    fromKind: centerKind,
    toKind: peerKind,
  });
  const current = edgePhraseValue(predicate, orientation);
  if (options.some((o) => o.value === current)) {
    return { predicate, orientation };
  }
  const preferred = preferredEdgePhrase(centerKind, peerKind);
  if (preferred) {
    return {
      predicate: preferred.predicate,
      orientation: preferred.orientation,
    };
  }
  return { predicate, orientation };
}
