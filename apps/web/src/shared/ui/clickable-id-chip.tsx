import { IdChip } from "@/shared/ui/id-chip";

/**
 * Evidence id chip with preview affordance (eye glyph).
 * Thin wrapper over `IdChip` `onPreview`.
 */
export function ClickableIdChip({
  value,
  onClick,
  head = 8,
  tail = 0,
  className,
}: {
  value: string;
  onClick?: (value: string) => void;
  head?: number;
  tail?: number;
  className?: string;
}) {
  return (
    <IdChip
      value={value}
      head={head}
      tail={tail}
      className={className}
      onPreview={onClick}
    />
  );
}
