import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { CaseRecord } from "@/domains/cases/types";

const setActiveCaseIdFn = vi.hoisted(() => vi.fn());

vi.mock("@/domains/cases/cases.functions", () => ({
  setActiveCaseIdFn,
}));

vi.mock("@/shared/lib/active-case-switch", () => ({
  optimisticActiveCaseSwitch: vi.fn(async () => ({ prev: null, next: null })),
  rollbackActiveCaseSwitch: vi.fn(),
  navigateAfterActiveCaseSwitch: vi.fn(),
  finalizeActiveCaseSwitch: vi.fn(),
}));

import { useSelectActiveCase } from "../use-select-active-case";

const cases: CaseRecord[] = [
  {
    id: "case-1",
    slug: "alpha",
    title: "Alpha",
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

describe("useSelectActiveCase", () => {
  it("calls setActiveCaseIdFn when mutating", async () => {
    setActiveCaseIdFn.mockResolvedValueOnce(undefined);
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });

    const { result } = renderHook(
      () => useSelectActiveCase({ cases }),
      {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      }
    );

    result.current.mutate("case-1");

    await waitFor(() => {
      expect(setActiveCaseIdFn).toHaveBeenCalledWith({
        data: { caseId: "case-1" },
      });
    });
  });
});
