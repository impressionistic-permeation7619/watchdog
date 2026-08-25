import {
  BoldIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
  UnderlineIcon,
} from "lucide-react";
import { KEYS } from "platejs";
import { useEditorRef, useEditorSelector } from "platejs/react";

import { Button } from "@/shared/ui/shadcn/button";
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/shadcn/toggle-group";
import { WithTooltip } from "@/shared/ui/timestamp";

type HeadingValue = "h1" | "h2" | "h3";
type MarkValue = "bold" | "italic" | "underline";

function isHeadingValue(value: string | undefined): value is HeadingValue {
  return value === "h1" || value === "h2" || value === "h3";
}

function activeHeading(
  isH1: boolean,
  isH2: boolean,
  isH3: boolean
): HeadingValue[] {
  if (isH1) return ["h1"];
  if (isH2) return ["h2"];
  if (isH3) return ["h3"];
  return [];
}

export function RichTextToolbar() {
  const editor = useEditorRef();
  const isH1 = useEditorSelector(
    (ed) => ed.api.some({ match: { type: KEYS.h1 } }),
    []
  );
  const isH2 = useEditorSelector(
    (ed) => ed.api.some({ match: { type: KEYS.h2 } }),
    []
  );
  const isH3 = useEditorSelector(
    (ed) => ed.api.some({ match: { type: KEYS.h3 } }),
    []
  );
  const isBold = useEditorSelector(
    (ed) => ed.api.some({ match: { [KEYS.bold]: true } }),
    []
  );
  const isItalic = useEditorSelector(
    (ed) => ed.api.some({ match: { [KEYS.italic]: true } }),
    []
  );
  const isUnderline = useEditorSelector(
    (ed) => ed.api.some({ match: { [KEYS.underline]: true } }),
    []
  );

  const headingValue = activeHeading(isH1, isH2, isH3);

  const markValue: MarkValue[] = [
    ...(isBold ? (["bold"] as const) : []),
    ...(isItalic ? (["italic"] as const) : []),
    ...(isUnderline ? (["underline"] as const) : []),
  ];

  return (
    <div
      role="toolbar"
      tabIndex={-1}
      aria-label="Formatting"
      className="border-border bg-muted/30 flex flex-wrap items-center gap-1 border-b px-1 py-1"
      onMouseDown={(e) => {
        e.preventDefault();
      }}
    >
      <ToggleGroup
        variant="outline"
        size="sm"
        spacing={0}
        value={headingValue}
        onValueChange={(next: string[]) => {
          const selected = next[0];
          if (isH1 && selected !== "h1") {
            editor.tf.toggleBlock(KEYS.h1);
          }
          if (isH2 && selected !== "h2") {
            editor.tf.toggleBlock(KEYS.h2);
          }
          if (isH3 && selected !== "h3") {
            editor.tf.toggleBlock(KEYS.h3);
          }
          if (!isHeadingValue(selected)) {
            return;
          }
          if (selected === "h1" && !isH1) {
            editor.tf.toggleBlock(KEYS.h1);
          }
          if (selected === "h2" && !isH2) {
            editor.tf.toggleBlock(KEYS.h2);
          }
          if (selected === "h3" && !isH3) {
            editor.tf.toggleBlock(KEYS.h3);
          }
        }}
        aria-label="Headings"
      >
        <ToggleGroupItem value="h1" aria-label="Heading 1" title="Heading 1">
          <Heading1Icon data-icon="inline-start" />
        </ToggleGroupItem>
        <ToggleGroupItem value="h2" aria-label="Heading 2" title="Heading 2">
          <Heading2Icon data-icon="inline-start" />
        </ToggleGroupItem>
        <ToggleGroupItem value="h3" aria-label="Heading 3" title="Heading 3">
          <Heading3Icon data-icon="inline-start" />
        </ToggleGroupItem>
      </ToggleGroup>

      <ToggleGroup
        multiple
        variant="outline"
        size="sm"
        spacing={0}
        value={markValue}
        onValueChange={(next: string[]) => {
          const wantBold = next.includes("bold");
          const wantItalic = next.includes("italic");
          const wantUnderline = next.includes("underline");
          if (wantBold !== isBold) {
            editor.tf.toggleMark(KEYS.bold);
          }
          if (wantItalic !== isItalic) {
            editor.tf.toggleMark(KEYS.italic);
          }
          if (wantUnderline !== isUnderline) {
            editor.tf.toggleMark(KEYS.underline);
          }
        }}
        aria-label="Text style"
      >
        <ToggleGroupItem value="bold" aria-label="Bold" title="Bold">
          <BoldIcon data-icon="inline-start" />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Italic" title="Italic">
          <ItalicIcon data-icon="inline-start" />
        </ToggleGroupItem>
        <ToggleGroupItem
          value="underline"
          aria-label="Underline"
          title="Underline"
        >
          <UnderlineIcon data-icon="inline-start" />
        </ToggleGroupItem>
      </ToggleGroup>

      <WithTooltip content="Bulleted list">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Bulleted list"
          className="size-7"
          onClick={() => {
            editor.tf.toggleBlock(KEYS.ul);
          }}
        >
          <ListIcon data-icon="inline-start" />
        </Button>
      </WithTooltip>
      <WithTooltip content="Numbered list">
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          aria-label="Numbered list"
          className="size-7"
          onClick={() => {
            editor.tf.toggleBlock(KEYS.ol);
          }}
        >
          <ListOrderedIcon data-icon="inline-start" />
        </Button>
      </WithTooltip>
    </div>
  );
}
