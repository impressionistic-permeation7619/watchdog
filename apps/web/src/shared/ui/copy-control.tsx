import { CheckIcon, CopyIcon } from "lucide-react";
import { useState, type ComponentProps } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/shared/ui/shadcn/button";
import { WithTooltip } from "@/shared/ui/timestamp";

type CopyControlSize = "xs" | "sm" | "md";

type CopyControlProps = {
  /** Full string written to the clipboard. */
  value: string;
  /** Fired after a successful copy — domains toast; DS never does. */
  onCopied?: (value: string) => void;
  /** Accessible name. Default: "Copy". */
  label?: string;
  className?: string;
  /** `xs` — dense embeds (IdChip). `sm`/`md` — standalone. */
  size?: CopyControlSize;
} & Omit<
  ComponentProps<typeof Button>,
  "onClick" | "children" | "size" | "value"
>;

const BUTTON_SIZE = {
  xs: "icon-xs",
  sm: "icon-sm",
  md: "icon",
} as const;

const ICON_CLASS = {
  xs: "size-3",
  sm: "size-3.5",
  md: "size-4",
} as const;

/**
 * Copy affordance. Presentational — no toasts.
 * Size maps to Button icon sizes; `xs` is for inline chips.
 */
export function CopyControl({
  value,
  onCopied,
  label = "Copy",
  className,
  size = "sm",
  ...props
}: CopyControlProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopied?.(value);
      window.setTimeout(() => {
        setCopied(false);
      }, 1200);
    } catch {
      // Parent may surface failure via onCopied absence + own handling.
    }
  }

  const iconCls = ICON_CLASS[size];

  return (
    <WithTooltip
      content={copied ? "Copied" : label}
      wrapSpan
      className="inline-flex shrink-0"
    >
      <Button
        type="button"
        variant="ghost"
        size={BUTTON_SIZE[size]}
        aria-label={copied ? "Copied" : label}
        className={cn(
          "text-muted-foreground hover:text-foreground shrink-0",
          className
        )}
        onClick={() => void handleCopy()}
        {...props}
      >
        {copied ? (
          <CheckIcon className={iconCls} aria-hidden />
        ) : (
          <CopyIcon className={iconCls} aria-hidden />
        )}
      </Button>
    </WithTooltip>
  );
}
