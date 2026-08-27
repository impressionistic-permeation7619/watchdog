import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
  CLAIM_CLASS_LABELS,
  CLAIM_CLASS_TONES,
  ENTITY_KIND_ICON_CLASS,
  ENTITY_KIND_ICON_SIZE,
  ENTITY_KIND_ICONS,
  type EntityKindIconSize,
  isEntityKind,
  kindBadgeLabel,
  kindBadgeTone,
  type KindValue,
} from "@/shared/ui/vocab/kind.lib";
import { VocabBadge } from "@/shared/ui/vocab/vocab-badge";
import type { ClaimClass, EntityKind } from "@watchdog/schemas";

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
  const label = kindBadgeLabel(kind);
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
      tone={kindBadgeTone(kind)}
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
