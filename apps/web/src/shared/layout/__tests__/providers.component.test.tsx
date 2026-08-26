import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
  useRouter: () => ({ options: { context: { queryClient: { id: "qc" } } } }),
}));

vi.mock("@/auth/client", () => ({ authClient: {} }));

vi.mock("@/auth/plugins/api-key", () => ({
  apiKeyPlugin: () => ({}),
}));

vi.mock("@/auth/ui/auth-provider", () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="auth-provider">{children}</div>
  ),
}));

import { Providers } from "@/shared/layout/providers";

describe("Providers", () => {
  it("wraps children in AuthProvider and marks hydration on mount", () => {
    render(
      <Providers>
        <div>App child</div>
      </Providers>
    );

    expect(screen.getByTestId("auth-provider")).toBeInTheDocument();
    expect(screen.getByText("App child")).toBeInTheDocument();
    expect(document.documentElement.dataset.hydrated).toBe("true");
  });
});
