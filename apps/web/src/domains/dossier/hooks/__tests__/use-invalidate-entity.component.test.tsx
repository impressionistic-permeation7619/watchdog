import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/lib/query-invalidation", () => ({
  invalidateAfterEntityChanged: vi.fn().mockResolvedValue(undefined),
}));

import { invalidateAfterEntityChanged } from "@/shared/lib/query-invalidation";

import { useInvalidateEntity } from "@/domains/dossier/hooks/use-invalidate-entity";

describe("useInvalidateEntity", () => {
  it("delegates to the shared entity invalidation contract", async () => {
    const client = new QueryClient();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(
      () =>
        useInvalidateEntity({
          caseId: "case-1",
          entityId: "ent-1",
          entitySlug: "alpha",
        }),
      { wrapper }
    );

    await result.current();
    expect(invalidateAfterEntityChanged).toHaveBeenCalledWith(client, "case-1", {
      entityId: "ent-1",
      slug: "alpha",
    });
  });
});
