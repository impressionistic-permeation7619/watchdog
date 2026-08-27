import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const onChangeMock = vi.fn();

vi.mock("platejs/react", () => ({
  Plate: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PlateContent: ({ placeholder }: { placeholder?: string }) => (
    <textarea aria-label="Rich text editor" placeholder={placeholder} />
  ),
  PlateContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  usePlateEditor: () => ({
    tf: { reset: vi.fn() },
    api: { markdown: { serialize: () => "updated" } },
  }),
}));

vi.mock("@platejs/markdown", () => ({
  MarkdownPlugin: {},
}));

vi.mock("@/shared/ui/rich-text/plugins", () => ({
  RichTextEditorPlugins: [],
}));

vi.mock("@/shared/ui/rich-text/rich-text-toolbar", () => ({
  RichTextToolbar: () => <div>Toolbar</div>,
}));

import { RichTextEditor } from "@/shared/ui/rich-text/rich-text-editor";

describe("RichTextEditor", () => {
  it("renders the editor shell and toolbar", () => {
    render(
      <RichTextEditor value="Hello" onChange={onChangeMock} placeholder="Write notes" />
    );

    expect(screen.getByText("Toolbar")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Write notes")).toBeInTheDocument();
    expect(screen.getByLabelText("Rich text editor")).toBeInTheDocument();
    expect(onChangeMock).not.toHaveBeenCalled();
  });
});
