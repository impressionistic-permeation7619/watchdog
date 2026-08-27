import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FileDropZone } from "@/domains/intake/components/file-drop-zone";

describe("FileDropZone", () => {
  it("renders drop copy and forwards chosen files", () => {
    const onFiles = vi.fn();

    render(<FileDropZone disabled={false} onFiles={onFiles} />);

    expect(screen.getByText("Drop files here")).toBeInTheDocument();
    expect(
      screen.getByText("One Evidence row per file · max 100 MB")
    ).toBeInTheDocument();

    const input = document.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    const file = new File(["x"], "a.txt", { type: "text/plain" });
    fireEvent.change(input!, { target: { files: [file] } });

    expect(onFiles).toHaveBeenCalledTimes(1);
  });

  it("does not accept drops when disabled", () => {
    const onFiles = vi.fn();

    render(<FileDropZone disabled onFiles={onFiles} />);

    const zone = screen.getByText("Drop files here").closest("div");
    expect(zone).not.toBeNull();

    const file = new File(["x"], "a.txt", { type: "text/plain" });
    fireEvent.drop(zone!, {
      dataTransfer: { files: [file] },
    });

    expect(onFiles).not.toHaveBeenCalled();
  });
});
