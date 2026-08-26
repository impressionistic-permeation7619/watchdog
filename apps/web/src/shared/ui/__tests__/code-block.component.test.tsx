import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("shiki", () => ({
  createHighlighter: vi.fn(async () => ({
    codeToHtml: (code: string) => `<pre class="shiki">${code}</pre>`,
  })),
}));

import { CodeBlock } from "@/shared/ui/code-block";

describe("CodeBlock", () => {
  it("falls back to plain pre before highlighting completes", () => {
    render(<CodeBlock code='{"ok":true}' mime="application/json" />);
    expect(screen.getByText('{"ok":true}')).toBeInTheDocument();
  });

  it("renders highlighted html when shiki resolves", async () => {
    const { container } = render(
      <CodeBlock code="hello" mime="text/plain" lang="text" />
    );

    await waitFor(() => {
      expect(container.querySelector(".shiki")).toBeInTheDocument();
    });
  });
});
