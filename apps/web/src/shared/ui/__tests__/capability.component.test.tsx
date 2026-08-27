import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { capabilityLabel, CapabilityLabel } from "@/shared/ui/vocab/capability";

describe("Capability vocab", () => {
  it("prefers catalog title over derived label", () => {
    expect(capabilityLabel("network.dns.lookup", "DNS Lookup")).toBe(
      "DNS Lookup"
    );
    expect(capabilityLabel("network.dns.lookup")).toMatch(/DNS/);
  });

  it("renders nothing when no label can be derived", () => {
    const { container } = render(<CapabilityLabel capabilityId={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders derived capability label", () => {
    render(<CapabilityLabel capabilityId="network.dns.lookup" />);
    expect(screen.getByText(/DNS/)).toBeInTheDocument();
  });
});
