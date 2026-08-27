import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FormSection } from "@/shared/ui/form-section";

describe("FormSection", () => {
  it("renders title, body, footer, and tone attributes", () => {
    render(
      <FormSection
        title="Credentials"
        description="Vault-backed keys"
        footer={<button type="button">Save</button>}
        footerStatus="Unsaved changes"
        tone="warning"
      >
        <div>Form body</div>
      </FormSection>
    );

    expect(
      screen.getByRole("heading", { name: "Credentials" })
    ).toBeInTheDocument();
    expect(screen.getByText("Vault-backed keys")).toBeInTheDocument();
    expect(screen.getByText("Form body")).toBeInTheDocument();
    expect(screen.getByText("Unsaved changes")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(document.querySelector("[data-tone='warning']")).toBeInTheDocument();
  });
});
