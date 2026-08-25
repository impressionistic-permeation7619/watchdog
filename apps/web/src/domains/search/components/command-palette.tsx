import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { setActiveCaseIdFn } from "@/domains/cases/cases.functions";
import { bumpActiveCaseHealEpoch } from "@/domains/cases/lib/active-case";
import { casesContextQuery, casesKeys } from "@/domains/cases/queries";
import type { CasesContext } from "@/domains/cases/types";
import { jumpNavItems } from "@/domains/search/lib/jump-nav";
import { searchCaseQuery } from "@/domains/search/queries";
import {
  SEARCH_MIN_QUERY_LENGTH,
  type SearchCaseResult,
} from "@/domains/search/types";
import { errMessage } from "@/lib/utils";
import { invalidateAfterCaseSwitch } from "@/shared/lib/query-invalidation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/shared/ui/shadcn/command";
import { Spinner } from "@/shared/ui/shadcn/spinner";

const DEBOUNCE_MS = 250;

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { data: casesCtx } = useSuspenseQuery({
    ...casesContextQuery(),
    meta: { silentError: true },
  });
  const activeCaseId = casesCtx.active?.id ?? "";
  const jumpItems = jumpNavItems();

  useEffect(() => {
    const trimmed = query.trim();
    const delay = trimmed.length >= SEARCH_MIN_QUERY_LENGTH ? DEBOUNCE_MS : 0;
    const timer = window.setTimeout(() => {
      setDebouncedQuery(
        trimmed.length >= SEARCH_MIN_QUERY_LENGTH ? trimmed : ""
      );
    }, delay);
    return () => {
      window.clearTimeout(timer);
    };
  }, [query]);

  const showResults = query.trim().length >= SEARCH_MIN_QUERY_LENGTH;
  const searchQuery = searchCaseQuery(activeCaseId, debouncedQuery);
  const {
    data: hits,
    isFetching,
    isError,
    error,
  } = useQuery({
    ...searchQuery,
    enabled: open && showResults && searchQuery.enabled,
  });

  const switchCaseMutation = useMutation({
    mutationFn: async (caseId: string) => {
      await setActiveCaseIdFn({ data: { caseId } });
      return caseId;
    },
    onMutate: async (
      caseId
    ): Promise<{
      prev: CasesContext | undefined;
      next: (typeof casesCtx.cases)[number] | undefined;
    }> => {
      const next = casesCtx.cases.find((c) => c.id === caseId);
      if (!next) {
        return { prev: undefined, next: undefined };
      }
      bumpActiveCaseHealEpoch();
      await queryClient.cancelQueries({ queryKey: casesKeys.context() });
      const prev = queryClient.getQueryData<CasesContext>(casesKeys.context());
      if (prev) {
        queryClient.setQueryData<CasesContext>(casesKeys.context(), {
          ...prev,
          active: next,
        });
      }
      return { prev, next };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(casesKeys.context(), ctx.prev);
      }
      toast.error(errMessage(err, "Failed to switch case"));
    },
    onSuccess: async (_id, _vars, ctx) => {
      await invalidateAfterCaseSwitch(queryClient);
      const next = ctx?.next;
      if (next) {
        queryClient.setQueryData<CasesContext>(casesKeys.context(), (prev) =>
          prev ? { ...prev, active: next } : prev
        );
        await navigate({
          to: "/cases/$caseSlug",
          params: { caseSlug: next.slug },
        });
      }
    },
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      setQuery("");
      setDebouncedQuery("");
    }
    onOpenChange(next);
  }

  function closeThen(run: () => void) {
    handleOpenChange(false);
    run();
  }

  function selectCase(hit: SearchCaseResult["cases"][number]) {
    handleOpenChange(false);
    if (hit.id === activeCaseId) {
      void navigate({
        to: "/cases/$caseSlug",
        params: { caseSlug: hit.slug },
      });
      return;
    }
    switchCaseMutation.mutate(hit.id);
  }

  const busy = showResults && isFetching && !hits;
  const emptyMessage = (() => {
    if (busy) {
      return (
        <span className="inline-flex items-center gap-2">
          <Spinner /> Searching…
        </span>
      );
    }
    if (isError) {
      return errMessage(error, "Search failed");
    }
    if (showResults) {
      return "No results found.";
    }
    return "Type at least 2 characters to search.";
  })();

  const resultHits = showResults ? hits : null;

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Search Watchdog"
      description="Search the Active Case or jump to a page"
      className="sm:max-w-lg"
    >
      <Command shouldFilter={!showResults}>
        <CommandInput
          placeholder="Search entities, evidence, tasks…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>{emptyMessage}</CommandEmpty>

          {showResults ? null : (
            <CommandGroup heading="Jump to">
              {jumpItems.map((item) => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.to}
                    value={`jump ${item.label}`}
                    onSelect={() => {
                      closeThen(() => {
                        void navigate({ to: item.to });
                      });
                    }}
                  >
                    <Icon />
                    <span>{item.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {resultHits && resultHits.entities.length > 0 ? (
            <CommandGroup heading="Entities">
              {resultHits.entities.map((hit) => (
                <CommandItem
                  key={hit.id}
                  value={`entity ${hit.name} ${hit.slug}`}
                  onSelect={() => {
                    closeThen(() => {
                      void navigate({
                        to: "/entities/$entitySlug",
                        params: { entitySlug: hit.slug },
                      });
                    });
                  }}
                >
                  <span className="truncate">{hit.name}</span>
                  <CommandShortcut>{hit.kind}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {resultHits && resultHits.identifiers.length > 0 ? (
            <CommandGroup heading="Identifiers">
              {resultHits.identifiers.map((hit) => (
                <CommandItem
                  key={hit.id}
                  value={`identifier ${hit.value} ${hit.entityName}`}
                  onSelect={() => {
                    closeThen(() => {
                      void navigate({
                        to: "/entities/$entitySlug",
                        params: { entitySlug: hit.entitySlug },
                        search: { tab: "identifiers" },
                      });
                    });
                  }}
                >
                  <span className="truncate">{hit.value}</span>
                  <CommandShortcut>{hit.entityName}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {resultHits && resultHits.evidence.length > 0 ? (
            <CommandGroup heading="Evidence">
              {resultHits.evidence.map((hit) => (
                <CommandItem
                  key={hit.id}
                  value={`evidence ${hit.label ?? hit.id}`}
                  onSelect={() => {
                    closeThen(() => {
                      void navigate({
                        to: "/intake",
                        search: { evidenceId: hit.id },
                      });
                    });
                  }}
                >
                  <span className="truncate">{hit.label ?? hit.kind}</span>
                  <CommandShortcut>{hit.kind}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {resultHits && resultHits.tasks.length > 0 ? (
            <CommandGroup heading="Tasks">
              {resultHits.tasks.map((hit) => (
                <CommandItem
                  key={hit.id}
                  value={`task ${hit.title}`}
                  onSelect={() => {
                    closeThen(() => {
                      void navigate({
                        to: "/tasks",
                        search: hit.entityId ? { entityId: hit.entityId } : {},
                      });
                    });
                  }}
                >
                  <span className="truncate">{hit.title}</span>
                  <CommandShortcut>{hit.status}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {resultHits && resultHits.jobs.length > 0 ? (
            <CommandGroup heading="Jobs">
              {resultHits.jobs.map((hit) => (
                <CommandItem
                  key={hit.id}
                  value={`job ${hit.capabilityId}`}
                  onSelect={() => {
                    closeThen(() => {
                      void navigate({
                        to: "/jobs",
                        search: { jobId: hit.id },
                      });
                    });
                  }}
                >
                  <span className="truncate">{hit.capabilityId}</span>
                  <CommandShortcut>{hit.status}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {resultHits && resultHits.proposals.length > 0 ? (
            <CommandGroup heading="Inbox">
              {resultHits.proposals.map((hit) => (
                <CommandItem
                  key={hit.id}
                  value={`proposal ${hit.summary ?? hit.id}`}
                  onSelect={() => {
                    closeThen(() => {
                      void navigate({
                        to: "/inbox",
                        search: { proposalId: hit.id },
                      });
                    });
                  }}
                >
                  <span className="truncate">
                    {hit.summary ?? hit.capabilityId ?? "Proposal"}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}

          {resultHits && resultHits.cases.length > 0 ? (
            <>
              <CommandSeparator />
              <CommandGroup heading="Cases">
                {resultHits.cases.map((hit) => (
                  <CommandItem
                    key={hit.id}
                    value={`case ${hit.name} ${hit.slug}`}
                    onSelect={() => {
                      selectCase(hit);
                    }}
                  >
                    <span className="truncate">{hit.name}</span>
                    {hit.id === activeCaseId ? (
                      <CommandShortcut>Active</CommandShortcut>
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          ) : null}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
