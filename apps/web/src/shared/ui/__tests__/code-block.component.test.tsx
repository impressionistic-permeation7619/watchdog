import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("shiki", () => ({
  createHighlighter: vi.fn(async () => ({
    codeToTokens: (code: string) => ({
      tokens: [[{ content: code, color: "#fff" }]],
    }),
  })),
}));

import { CodeBlock } from "@/shared/ui/code-block";

describe("CodeBlock", () => {
  it("falls back to plain pre before highlighting completes", () => {
    render(<CodeBlock code='{"ok":true}' mime="application/json" />);
    expect(screen.getByText('{"ok":true}')).toBeInTheDocument();
  });

  it("renders highlighted tokens when shiki resolves", async () => {
    const { container } = render(
      <CodeBlock code="hello" mime="text/plain" lang="text" />
    );

    await waitFor(() => {
      expect(container.querySelector("pre")?.textContent).toContain("hello");
    });
  });
});
