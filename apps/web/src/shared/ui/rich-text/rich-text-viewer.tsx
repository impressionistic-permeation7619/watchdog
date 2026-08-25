import { MarkdownPlugin } from "@platejs/markdown";
import { Plate, PlateContent, usePlateEditor } from "platejs/react";

import { cn } from "@/lib/utils";
import { RichTextEditorPlugins } from "@/shared/ui/rich-text/plugins";

interface Props {
  value: string;
  className?: string;
}

/** Read-only Markdown via Plate (React plugins required for PlateContent). */
export function RichTextViewer({ value, className }: Props) {
  const editor = usePlateEditor(
    {
      plugins: RichTextEditorPlugins,
      value: (ed) =>
        ed.getApi(MarkdownPlugin).markdown.deserialize(value || ""),
    },
    [value]
  );

  return (
    <Plate editor={editor} readOnly>
      <PlateContent
        readOnly
        className={cn("text-sm leading-relaxed outline-none", className)}
      />
    </Plate>
  );
}
