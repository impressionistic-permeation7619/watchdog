import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  FormInlineError,
  FormInlineWarning,
} from "@/shared/ui/form-inline-message";

describe("FormInlineMessage", () => {
  it("renders error and warning alerts", () => {
    render(<FormInlineError>Invalid value</FormInlineError>);
    expect(screen.getByRole("alert")).toHaveTextContent("Invalid value");

    render(<FormInlineWarning>Check spelling</FormInlineWarning>);
    expect(screen.getByRole("status")).toHaveTextContent("Check spelling");
  });

  it("renders nothing for empty children", () => {
    const { container } = render(<FormInlineError>{""}</FormInlineError>);
    expect(container).toBeEmptyDOMElement();
  });
});
