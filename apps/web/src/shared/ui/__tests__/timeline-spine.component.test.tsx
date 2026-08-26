import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TimelineDot, TimelineSpine } from "@/shared/ui/timeline-spine";

describe("TimelineSpine", () => {
  it("renders dashed spine content and dot markers", () => {
    render(
      <TimelineSpine className="ml-2">
        <TimelineDot className="left-0 size-2 bg-accent" />
        <div>Event body</div>
      </TimelineSpine>
    );

    expect(screen.getByText("Event body")).toBeInTheDocument();
    expect(document.querySelector(".border-dashed")).toBeInTheDocument();
  });
});
