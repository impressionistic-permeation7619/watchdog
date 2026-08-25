import { SearchIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { CONTROL_SHELL, CONTROL_TEXT } from "@/shared/ui/control-chrome";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/shared/ui/shadcn/input-group";

interface SearchFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  "aria-label": string;
  className?: string;
  /** Show clear button when non-empty. Default true. */
  clearable?: boolean;
}

/**
 * Named search input for Queue filter bars / toolbars.
 * Dumb — no debounce, no fetch. Shares dense CONTROL_* chrome.
 */
export function SearchField({
  value,
  onValueChange,
  placeholder = "Search…",
  "aria-label": ariaLabel,
  className,
  clearable = true,
}: SearchFieldProps) {
  return (
    <InputGroup
      className={cn(CONTROL_SHELL, "max-w-sm min-w-48 flex-1", className)}
    >
      <InputGroupAddon align="inline-start">
        <SearchIcon className="size-3.5" aria-hidden />
      </InputGroupAddon>
      <InputGroupInput
        value={value}
        onChange={(e) => {
          onValueChange(e.target.value);
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={CONTROL_TEXT}
      />
      {clearable && value ? (
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label="Clear search"
            onClick={() => {
              onValueChange("");
            }}
          >
            <XIcon className="size-3.5" />
          </InputGroupButton>
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}
