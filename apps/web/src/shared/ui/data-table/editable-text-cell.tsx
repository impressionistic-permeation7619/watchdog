import { forwardRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

import { cn } from "@/lib/utils";
import { CONTROL_CELL } from "@/shared/ui/control-chrome";
import { Input } from "@/shared/ui/shadcn/input";

interface Props {
  value: string;
  /** Return `false` to reject and revert. */
  // oxlint-disable-next-line typescript/no-invalid-void-type -- callers commonly pass a void-returning setter for "accept"; `boolean | undefined` would break every such call site
  onCommit: (next: string) => boolean | void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  type?: "text" | "email" | "tel" | "url";
  sanitize?: (next: string) => string;
  "aria-label"?: string;
  mono?: boolean;
  autoFocus?: boolean;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  /** Trailing control (e.g. external link) — rendered beside the input. */
  suffix?: ReactNode;
}

/**
 * Notion/Airtable-style text cell.
 * Local draft — commits on blur/Enter, reverts on Escape.
 * Shares CONTROL_CELL chrome with EditableSelectCell / EntityCombobox cell.
 */
export const EditableTextCell = forwardRef<HTMLInputElement, Props>(
  (
    {
      value,
      onCommit,
      disabled = false,
      className,
      placeholder,
      type = "text",
      sanitize,
      "aria-label": ariaLabel,
      mono = false,
      autoFocus = false,
      onKeyDown: externalKeyDown,
      suffix,
    },
    ref
  ) => {
    const [draft, setDraft] = useState(value);
    // Reset the local draft whenever the committed value changes underneath
    // us (e.g. another cell saved, or the row was refetched).
    const [prevValue, setPrevValue] = useState(value);
    if (value !== prevValue) {
      setPrevValue(value);
      setDraft(value);
    }

    function commit() {
      if (disabled || draft === value) return;
      if (onCommit(draft) === false) setDraft(value);
    }

    function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
      externalKeyDown?.(e);
      if (e.key === "Escape") {
        e.preventDefault();
        setDraft(value);
        e.currentTarget.blur();
        return;
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        commit();
        e.currentTarget.blur();
      }
    }

    const input = (
      <Input
        ref={ref}
        type={type}
        value={draft}
        autoFocus={autoFocus}
        onChange={(e) => {
          const next = sanitize ? sanitize(e.target.value) : e.target.value;
          setDraft(next);
        }}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={ariaLabel}
        autoComplete="off"
        data-1p-ignore
        data-lpignore="true"
        data-form-type="other"
        className={cn(
          CONTROL_CELL,
          "px-1.5 text-xs focus-visible:ring-0",
          mono && "font-mono",
          className
        )}
      />
    );

    if (!suffix) return input;

    return (
      <span className="inline-flex w-full min-w-0 items-center gap-0.5">
        <span className="min-w-0 flex-1">{input}</span>
        {suffix}
      </span>
    );
  }
);
EditableTextCell.displayName = "EditableTextCell";
