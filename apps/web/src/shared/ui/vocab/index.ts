export { titleCase, optionsFromLabels } from "@/shared/ui/vocab/title-case";
export { VocabBadge, type VocabTone } from "@/shared/ui/vocab/vocab-badge";

export {
  ConfidenceBadge,
  CONFIDENCE_LABELS,
  CONFIDENCE_OPTIONS,
  CONFIDENCE_TONES,
  confidenceLabel,
} from "@/shared/ui/vocab/confidence";

export {
  StatusBadge,
  STATUS_LABELS,
  STATUS_TONES,
  STATUS_DOT,
  JOB_STATUS_OPTIONS,
  PROPOSAL_STATUS_OPTIONS,
  IDENTIFIER_STATUS_OPTIONS,
  RETRACT_KIND_OPTIONS,
  JOB_LABELS,
  PROPOSAL_LABELS,
  statusLabel,
  type DisplayStatus,
} from "@/shared/ui/vocab/status";

export {
  KindBadge,
  ClaimClassBadge,
  EntityKindIcon,
  isEntityKind,
  KIND_LABELS,
  KIND_TONES,
  ENTITY_KIND_LABELS,
  EVIDENCE_KIND_LABELS,
  IDENTIFIER_TYPE_LABELS,
  CLAIM_CLASS_LABELS,
  CLAIM_CLASS_TONES,
  ENTITY_KIND_OPTIONS,
  EVIDENCE_KIND_OPTIONS,
  IDENTIFIER_TYPE_OPTIONS,
  IDENTIFIER_PLATFORM_OPTIONS,
  CLAIM_CLASS_OPTIONS,
  kindLabel,
  kindTone,
  type KindValue,
} from "@/shared/ui/vocab/kind";

export {
  EDGE_PREDICATE_LABELS,
  EDGE_PREDICATE_META,
  EDGE_PREDICATE_GROUPS,
  EDGE_PREDICATE_GROUP_LABELS,
  clampEdgePhrase,
  edgePhraseOptions,
  edgePhraseValue,
  parseEdgePhraseValue,
  preferredEdgePhrase,
  isEdgePredicate,
  predicateLabel,
  type EdgeDirection,
  type EdgeOrientation,
  type EdgePredicateGroup,
  type EdgePhraseOption,
} from "@/shared/ui/vocab/edge-predicate";

export {
  PatchOpBadge,
  PATCH_OP_LABELS,
  PATCH_OP_TONES,
  PATCH_RESOURCE_META,
  patchOpLabel,
} from "@/shared/ui/vocab/patch-op";

export { CapabilityLabel, capabilityLabel } from "@/shared/ui/vocab/capability";

export {
  TaskStatusBadge,
  TASK_STATUS_LABELS,
  TASK_STATUS_OPTIONS,
  TASK_STATUS_TONE_MAP,
  taskStatusLabel,
  taskStatusTone,
} from "@/shared/ui/vocab/task-status";

export {
  TaskPriorityBadge,
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_OPTIONS,
  TASK_PRIORITY_TONE_MAP,
  taskPriorityLabel,
  taskPriorityTone,
} from "@/shared/ui/vocab/task-priority";
