import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

import { EgoNodeMenu } from "@/domains/dossier/components/ego-graph/ego-node-menu";

describe("EgoNodeMenu", () => {
  it("renders peer navigation and connection edit actions", async () => {
    const onEditEdge = vi.fn();
    render(
      <EgoNodeMenu
        x={10}
        y={20}
        node={{ id: "ent-1", label: "Peer", slug: "peer" }}
        connections={[{ edgeId: "edge-1", label: "related to" }]}
        onClose={vi.fn()}
        onEditEdge={onEditEdge}
      />
    );

    expect(screen.getByText("Peer")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open dossier" })).toHaveAttribute(
      "href",
      "/entities/$entitySlug"
    );

    await userEvent.click(
      screen.getByRole("menuitem", { name: "Edit connection…" })
    );
    expect(onEditEdge).toHaveBeenCalledWith("edge-1");
  });
});
