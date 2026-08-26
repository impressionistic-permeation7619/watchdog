import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QueueSkeleton, StackBodySkeleton } from "@/shared/ui/skeletons";

describe("Skeletons", () => {
  it("renders queue and stack loading placeholders", () => {
    const { container: queue } = render(<QueueSkeleton rows={2} />);
    expect(queue.querySelectorAll(".border-b")).toHaveLength(2);

    const { container: stack } = render(<StackBodySkeleton sections={1} />);
    expect(stack.querySelector("[aria-busy='true']")).toBeInTheDocument();
  });
});
