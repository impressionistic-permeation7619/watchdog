import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Suspense } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { testId } from "@watchdog/test-kit";

import type { CaseRecord } from "@/domains/cases/types";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal("ResizeObserver", ResizeObserverMock);

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

vi.mock("@/auth/server", () => ({
  auth: {},
}));

const navigateMock = vi.hoisted(() => vi.fn());
const switchCaseMutateMock = vi.hoisted(() => vi.fn());
const useSuspenseQueryMock = vi.hoisted(() => vi.fn());
const useQueryMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("@/shared/lib/use-select-active-case", () => ({
  useSelectActiveCase: () => ({ mutate: switchCaseMutateMock }),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useSuspenseQuery: (...args: unknown[]) => useSuspenseQueryMock(...args),
    useQuery: (...args: unknown[]) => useQueryMock(...args),
  };
});

import { CommandPalette } from "@/domains/search/components/command-palette";

const ACTIVE: CaseRecord = {
  id: testId(10),
  slug: "alpha",
  name: "Alpha",
  description: null,
  allowThirdPartyEgress: false,
};

function renderPalette(
  open = true,
  queryResult: {
    data?: unknown;
    isFetching?: boolean;
    isError?: boolean;
    error?: unknown;
  } = {
    data: undefined,
    isFetching: false,
    isError: false,
  }
) {
  useSuspenseQueryMock.mockReturnValue({
    data: { active: ACTIVE, cases: [ACTIVE] },
  });
  useQueryMock.mockReturnValue(queryResult);

  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={client}>
      <Suspense fallback={null}>
        <CommandPalette open={open} onOpenChange={vi.fn()} />
      </Suspense>
    </QueryClientProvider>
  );
}

describe("CommandPalette", () => {
  it("shows jump navigation when the query is shorter than the search minimum", () => {
    renderPalette();
    expect(screen.getByText("Jump to")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Search entities, evidence, tasks…")
    ).toBeInTheDocument();
  });

  it("shows entity hits after debounced search input", async () => {
    renderPalette(true, {
      data: {
        entities: [
          {
            id: testId(20),
            name: "Target One",
            slug: "target-one",
            kind: "person",
          },
        ],
        identifiers: [],
        evidence: [],
        tasks: [],
        jobs: [],
        proposals: [],
        cases: [],
      },
      isFetching: false,
      isError: false,
    });
    fireEvent.change(
      screen.getByPlaceholderText("Search entities, evidence, tasks…"),
      { target: { value: "ta" } }
    );

    await waitFor(() => {
      expect(screen.queryByText("Jump to")).not.toBeInTheDocument();
      expect(screen.getByText("Entities")).toBeInTheDocument();
      expect(screen.getByText("Target One")).toBeInTheDocument();
    });
  });

  it("shows a loading state while search results are fetching", async () => {
    renderPalette(true, {
      data: undefined,
      isFetching: true,
      isError: false,
    });
    fireEvent.change(
      screen.getByPlaceholderText("Search entities, evidence, tasks…"),
      { target: { value: "ab" } }
    );

    await waitFor(() => {
      expect(screen.getByText("Searching…")).toBeInTheDocument();
    });
  });

  it("shows an error message when the search query fails", async () => {
    renderPalette(true, {
      data: undefined,
      isFetching: false,
      isError: true,
      error: new Error("Network down"),
    });
    fireEvent.change(
      screen.getByPlaceholderText("Search entities, evidence, tasks…"),
      { target: { value: "xy" } }
    );

    await waitFor(() => {
      expect(screen.getByText("Network down")).toBeInTheDocument();
    });
  });
});
