/* oxlint-disable react/only-export-components -- vocab labels/tones + badge components */
import { Building2Icon, ServerIcon, UserIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { optionsFromLabels, titleCase } from "@/shared/ui/vocab/title-case";
import type { VocabTone } from "@/shared/ui/vocab/vocab-badge";
import { VocabBadge } from "@/shared/ui/vocab/vocab-badge";
import {
  CLAIM_CLASSES,
  ENTITY_KINDS,
  EVIDENCE_KINDS,
  IDENTIFIER_PLATFORMS,
  IDENTIFIER_TYPES,
  type ClaimClass,
  type EntityKind,
  type EvidenceKind,
  type IdentifierType,
} from "@watchdog/schemas";

/** Entity / evidence / identifier kinds — not claim classes. */
export type KindValue = EntityKind | EvidenceKind | IdentifierType;

export const ENTITY_KIND_LABELS: Record<EntityKind, string> = {
  person: "Person",
  infra: "Infra",
  org: "Org",
};

const ENTITY_KIND_ICONS = {
  person: UserIcon,
  org: Building2Icon,
  infra: ServerIcon,
} as const;

const ENTITY_KIND_ICON_CLASS: Record<EntityKind, string> = {
  person: "text-kind-person",
  org: "text-kind-org",
  infra: "text-kind-infra",
};

type EntityKindIconSize = "sm" | "md";

const ENTITY_KIND_ICON_SIZE: Record<EntityKindIconSize, string> = {
  sm: "size-3",
  md: "size-3.5",
};

export function isEntityKind(value: string): value is EntityKind {
  return value in ENTITY_KIND_LABELS;
}

/** Kind glyph for person / org / infra. */
export function EntityKindIcon({
  kind,
  size = "md",
  toned = true,
  className,
  ...props
}: {
  kind: EntityKind;
  size?: EntityKindIconSize;
  /** Inherit currentColor when nested in KindBadge. */
  toned?: boolean;
  className?: string;
} & Omit<ComponentProps<"svg">, "children">) {
  const Icon = ENTITY_KIND_ICONS[kind];
  return (
    <Icon
      aria-hidden
      strokeWidth={2}
      className={cn(
        "shrink-0",
        ENTITY_KIND_ICON_SIZE[size],
        toned && ENTITY_KIND_ICON_CLASS[kind],
        className
      )}
      {...props}
    />
  );
}

export const EVIDENCE_KIND_LABELS: Record<EvidenceKind, string> = {
  file: "File",
  url_archive: "URL Archive",
  attestation: "Attestation",
  other: "Other",
};

export const IDENTIFIER_TYPE_LABELS: Record<IdentifierType, string> = {
  email: "Email",
  handle: "Handle",
  phone: "Phone",
  url: "URL",
  domain: "Domain",
  ip: "IP",
  crypto: "Crypto",
  pgp: "PGP",
  credential: "Credential",
  other: "Other",
};

export const CLAIM_CLASS_LABELS: Record<ClaimClass, string> = {
  observation: "Observation",
  assessment: "Assessment",
  allegation: "Allegation",
  other: "Other",
};

export const ENTITY_KIND_TONES: Record<EntityKind, VocabTone> = {
  person: {
    low: "bg-kind-person/15 text-kind-person",
    high: "bg-kind-person text-primary-foreground",
  },
  infra: {
    low: "bg-kind-infra/15 text-kind-infra",
    high: "bg-kind-infra text-primary-foreground",
  },
  org: {
    low: "bg-kind-org/15 text-kind-org",
    high: "bg-kind-org text-primary-foreground",
  },
};

export const EVIDENCE_KIND_TONES: Record<EvidenceKind, VocabTone> = {
  file: {
    low: "bg-kind-file/15 text-kind-file",
    high: "bg-kind-file text-primary-foreground",
  },
  url_archive: {
    low: "bg-kind-url_archive/15 text-kind-url_archive",
    high: "bg-kind-url_archive text-primary-foreground",
  },
  attestation: {
    low: "bg-kind-attestation/15 text-kind-attestation",
    high: "bg-kind-attestation text-primary-foreground",
  },
  other: {
    low: "bg-kind-other/15 text-kind-other",
    high: "bg-kind-other text-primary-foreground",
  },
};

export const IDENTIFIER_TYPE_TONES: Record<IdentifierType, VocabTone> = {
  email: {
    low: "bg-kind-email/15 text-kind-email",
    high: "bg-kind-email text-primary-foreground",
  },
  handle: {
    low: "bg-kind-handle/15 text-kind-handle",
    high: "bg-kind-handle text-primary-foreground",
  },
  phone: {
    low: "bg-kind-phone/15 text-kind-phone",
    high: "bg-kind-phone text-primary-foreground",
  },
  url: {
    low: "bg-kind-url/15 text-kind-url",
    high: "bg-kind-url text-primary-foreground",
  },
  domain: {
    low: "bg-kind-domain/15 text-kind-domain",
    high: "bg-kind-domain text-primary-foreground",
  },
  ip: {
    low: "bg-kind-ip/15 text-kind-ip",
    high: "bg-kind-ip text-primary-foreground",
  },
  crypto: {
    low: "bg-kind-crypto/15 text-kind-crypto",
    high: "bg-kind-crypto text-primary-foreground",
  },
  pgp: {
    low: "bg-kind-pgp/15 text-kind-pgp",
    high: "bg-kind-pgp text-primary-foreground",
  },
  credential: {
    low: "bg-kind-credential/15 text-kind-credential",
    high: "bg-kind-credential text-primary-foreground",
  },
  other: {
    low: "bg-kind-other/15 text-kind-other",
    high: "bg-kind-other text-primary-foreground",
  },
};

export const CLAIM_CLASS_TONES: Record<ClaimClass, VocabTone> = {
  observation: {
    low: "bg-kind-observation/15 text-kind-observation",
    high: "bg-kind-observation text-primary-foreground",
  },
  assessment: {
    low: "bg-kind-assessment/15 text-kind-assessment",
    high: "bg-kind-assessment text-primary-foreground",
  },
  allegation: {
    low: "bg-kind-allegation/15 text-kind-allegation",
    high: "bg-kind-allegation text-primary-foreground",
  },
  other: {
    low: "bg-kind-other/15 text-kind-other",
    high: "bg-kind-other text-primary-foreground",
  },
};

/** Lookup across entity/evidence/identifier maps only (claim classes use ClaimClassBadge). */
export const KIND_LABELS: Record<KindValue, string> = {
  ...ENTITY_KIND_LABELS,
  ...EVIDENCE_KIND_LABELS,
  ...IDENTIFIER_TYPE_LABELS,
};

export const KIND_TONES: Record<KindValue, VocabTone> = {
  ...ENTITY_KIND_TONES,
  ...EVIDENCE_KIND_TONES,
  ...IDENTIFIER_TYPE_TONES,
};

export const ENTITY_KIND_OPTIONS = optionsFromLabels(
  ENTITY_KINDS,
  ENTITY_KIND_LABELS
);
export const EVIDENCE_KIND_OPTIONS = optionsFromLabels(
  EVIDENCE_KINDS,
  EVIDENCE_KIND_LABELS
);
export const IDENTIFIER_TYPE_OPTIONS = optionsFromLabels(
  IDENTIFIER_TYPES,
  IDENTIFIER_TYPE_LABELS
);
export const IDENTIFIER_PLATFORM_OPTIONS = IDENTIFIER_PLATFORMS.map((p) => ({
  value: p.slug,
  label: p.label,
}));
export const CLAIM_CLASS_OPTIONS = optionsFromLabels(
  CLAIM_CLASSES,
  CLAIM_CLASS_LABELS
);

const FALLBACK_TONE: VocabTone = {
  low: "bg-kind-unknown/15 text-kind-unknown",
  high: "bg-kind-unknown text-primary-foreground",
};

function isKindValue(value: string): value is KindValue {
  return value in KIND_LABELS;
}

export function kindLabel(value: string): string {
  const key = value.trim().toLowerCase();
  return isKindValue(key) ? KIND_LABELS[key] : titleCase(value);
}

export function kindTone(value: string): VocabTone {
  const key = value.trim().toLowerCase();
  return isKindValue(key) ? KIND_TONES[key] : FALLBACK_TONE;
}

type KindBadgeProps = Omit<
  ComponentProps<typeof VocabBadge>,
  "label" | "tone"
> & {
  kind: KindValue;
};

export function KindBadge({
  kind,
  contrast = "low",
  className,
  children,
  ...props
}: KindBadgeProps) {
  const label = KIND_LABELS[kind];
  let content: ReactNode = children ?? label;
  if (isEntityKind(kind)) {
    content = (
      <>
        <EntityKindIcon kind={kind} size="sm" toned={false} />
        {children ?? label}
      </>
    );
  }

  return (
    <VocabBadge
      label={label}
      tone={KIND_TONES[kind]}
      contrast={contrast}
      className={cn(isEntityKind(kind) && "gap-1.25", className)}
      {...props}
    >
      {content}
    </VocabBadge>
  );
}

type ClaimClassBadgeProps = Omit<
  ComponentProps<typeof VocabBadge>,
  "label" | "tone"
> & {
  claimClass: ClaimClass;
};

export function ClaimClassBadge({
  claimClass,
  contrast = "low",
  className,
  children,
  ...props
}: ClaimClassBadgeProps) {
  return (
    <VocabBadge
      label={CLAIM_CLASS_LABELS[claimClass]}
      tone={CLAIM_CLASS_TONES[claimClass]}
      contrast={contrast}
      className={className}
      {...props}
    >
      {children}
    </VocabBadge>
  );
}
