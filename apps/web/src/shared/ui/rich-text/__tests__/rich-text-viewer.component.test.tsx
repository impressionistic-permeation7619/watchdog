import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("platejs/react", () => ({
  Plate: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PlateContent: ({ className }: { className?: string }) => (
    <div className={className}>Viewer content</div>
  ),
  usePlateEditor: () => ({}),
}));

vi.mock("@platejs/markdown", () => ({
  MarkdownPlugin: {},
}));

vi.mock("@/shared/ui/rich-text/plugins", () => ({
  RichTextEditorPlugins: [],
}));

import { RichTextViewer } from "@/shared/ui/rich-text/rich-text-viewer";

describe("RichTextViewer", () => {
  it("renders read-only markdown content", () => {
    render(<RichTextViewer value="# Hello" />);
    expect(screen.getByText("Viewer content")).toBeInTheDocument();
    expect(screen.getByText("Viewer content")).toHaveClass("text-sm");
    expect(screen.getByText("Viewer content")).toBeVisible();
  });
});
