import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CopyControl } from "@/shared/ui/copy-control";

describe("CopyControl", () => {
  it("copies the value and notifies the parent", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const onCopied = vi.fn();

    render(<CopyControl value="secret-token" onCopied={onCopied} label="Copy token" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy token" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("secret-token");
      expect(onCopied).toHaveBeenCalledWith("secret-token");
    });
  });
});
