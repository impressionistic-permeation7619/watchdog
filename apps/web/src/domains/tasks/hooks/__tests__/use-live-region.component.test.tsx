import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useLiveRegion } from "@/domains/tasks/hooks/use-live-region";

function LiveRegionProbe() {
  const { announce, liveRegion } = useLiveRegion();
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          announce("Saved task");
        }}
      >
        Announce
      </button>
      {liveRegion}
    </div>
  );
}

describe("useLiveRegion", () => {
  it("announces messages in a polite live region", async () => {
    vi.useFakeTimers();
    render(<LiveRegionProbe />);
    await act(async () => {
      screen.getByRole("button", { name: "Announce" }).click();
    });
    await act(async () => {
      await vi.runOnlyPendingTimersAsync();
    });
    expect(screen.getByText("Saved task")).toHaveAttribute(
      "aria-live",
      "polite"
    );
    vi.useRealTimers();
  });
});
