import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  FolderIcon,
  LayoutDashboardIcon,
  PlusIcon,
} from "lucide-react";
import { Suspense, useEffect } from "react";
import { toast } from "sonner";

import { CASE_NAV_ITEMS, pathActive } from "@/config/nav";
import { setActiveCaseIdFn } from "@/domains/cases/cases.functions";
import { bumpActiveCaseHealEpoch } from "@/domains/cases/lib/active-case";
import { casesContextQuery, casesKeys } from "@/domains/cases/queries";
import type { CaseRecord, CasesContext } from "@/domains/cases/types";
import { errMessage } from "@/lib/utils";
import {
  bindCasesChangedInvalidation,
  invalidateAfterCaseSwitch,
} from "@/shared/lib/query-invalidation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/shadcn/dropdown-menu";
import {
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/shared/ui/shadcn/sidebar";

/** True on `/cases/$caseSlug` (Overview) — not Manage `/cases`. */
function isCaseOverviewPath(pathname: string): boolean {
  return /^\/cases\/[^/]+/.test(pathname);
}

function CaseSwitcherSkeleton() {
  return (
    <>
      <SidebarGroupLabel>Case</SidebarGroupLabel>
      <div className="dark:bg-input/30 h-8 w-full animate-pulse rounded-md bg-transparent" />
    </>
  );
}

function CaseNavLinks({
  caseSlug,
  collapsed,
}: {
  caseSlug: string | undefined;
  collapsed: boolean;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const overviewActive =
    caseSlug !== undefined &&
    (pathname === `/cases/${caseSlug}` ||
      pathname.startsWith(`/cases/${caseSlug}/`));

  if (collapsed || !caseSlug) return null;

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          isActive={overviewActive}
          tooltip="Overview"
          render={<Link to="/cases/$caseSlug" params={{ caseSlug }} />}
        >
          <LayoutDashboardIcon />
          <span>Overview</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      {CASE_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <SidebarMenuItem key={item.to}>
            <SidebarMenuButton
              isActive={pathActive(pathname, item.to)}
              tooltip={item.label}
              render={<Link to={item.to} />}
            >
              <Icon />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </>
  );
}

function CasePickerItems({
  cases,
  activeId,
  onSelect,
}: {
  cases: CaseRecord[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <>
      {cases.map((c) => {
        const selected = c.id === activeId;
        return (
          <DropdownMenuItem
            key={c.id}
            onClick={() => {
              onSelect(c.id);
            }}
          >
            <span className="truncate">{c.name}</span>
            {selected ? <CheckIcon className="ml-auto size-4" /> : null}
          </DropdownMenuItem>
        );
      })}
    </>
  );
}

function CaseSwitcherReady() {
  const { state, isMobile } = useSidebar();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const entityId = useRouterState({
    select: (s): string | undefined => {
      const search: unknown = s.location.search;
      if (
        typeof search === "object" &&
        search !== null &&
        "entityId" in search
      ) {
        const value: unknown = search.entityId;
        if (typeof value === "string") return value;
      }
      // oxlint-disable-next-line unicorn/no-useless-undefined -- select must return string | undefined
      return undefined;
    },
  });
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery({
    ...casesContextQuery(),
    meta: { silentError: true },
  });

  useEffect(() => bindCasesChangedInvalidation(queryClient), [queryClient]);

  const cases = data.cases;
  const activeId = data.active?.id ?? "";
  const active = data.active;
  const collapsed = state === "collapsed" && !isMobile;

  const selectMutation = useMutation({
    mutationFn: async (id: string) => {
      await setActiveCaseIdFn({ data: { caseId: id } });
      return id;
    },
    onMutate: async (id) => {
      const next = cases.find((c) => c.id === id);
      if (!next) {
        // oxlint-disable-next-line unicorn/no-useless-undefined -- onMutate context is { prev } | undefined
        return undefined;
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
      return { prev };
    },
    onError: (err, _id, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(casesKeys.context(), ctx.prev);
      }
      toast.error(errMessage(err, "Failed to switch case"));
    },
    onSuccess: async (id) => {
      const next = cases.find((c) => c.id === id);
      // Overview heals cookie from the URL — follow the new slug.
      if (next && isCaseOverviewPath(pathname)) {
        await navigate({
          to: "/cases/$caseSlug",
          params: { caseSlug: next.slug },
          replace: true,
        });
      } else if (pathname === "/tasks" && entityId) {
        await navigate({ to: "/tasks", search: {}, replace: true });
      }
      await invalidateAfterCaseSwitch(queryClient);
      // Refetch can lag the cookie write.
      if (next) {
        queryClient.setQueryData<CasesContext>(casesKeys.context(), (prev) =>
          prev ? { ...prev, active: next } : prev
        );
      }
    },
  });

  function selectCase(id: string) {
    if (id === activeId) return;
    selectMutation.mutate(id);
  }

  if (cases.length === 0) {
    if (collapsed) {
      return (
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Create a Case"
              render={<Link to="/cases" />}
            >
              <PlusIcon />
              <span>Create a case…</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      );
    }

    return (
      <>
        <SidebarGroupLabel>Case</SidebarGroupLabel>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link to="/cases" />}>
              <PlusIcon />
              <span>Create a case…</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </>
    );
  }

  if (collapsed) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  tooltip={active?.name ?? "Case"}
                  className="dark:bg-input/30 data-open:bg-sidebar-accent dark:data-open:bg-input/50 data-open:text-sidebar-accent-foreground bg-transparent"
                />
              }
            >
              <FolderIcon />
              <span>{active?.name ?? "Case"}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="min-w-48"
              side="right"
              align="end"
              sideOffset={8}
            >
              <CasePickerItems
                cases={cases}
                activeId={activeId}
                onSelect={selectCase}
              />
              {active ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    render={
                      <Link
                        to="/cases/$caseSlug"
                        params={{ caseSlug: active.slug }}
                      />
                    }
                  >
                    <LayoutDashboardIcon />
                    Overview
                  </DropdownMenuItem>
                  {CASE_NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <DropdownMenuItem
                        key={item.to}
                        render={<Link to={item.to} />}
                      >
                        <Icon />
                        {item.label}
                      </DropdownMenuItem>
                    );
                  })}
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <>
      <SidebarGroupLabel>Case</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  aria-label="Active case"
                  tooltip={active?.name ?? "Case"}
                  className="dark:bg-input/30 data-popup-open:bg-input/30 data-popup-open:text-sidebar-accent-foreground h-8 bg-transparent data-popup-open:!rounded-b-none"
                />
              }
            >
              <FolderIcon />
              <span className="truncate">{active?.name ?? "Select case…"}</span>
              <ChevronsUpDownIcon className="ml-auto size-3.5 opacity-50" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="bg-sidebar w-(--anchor-width) min-w-0 overflow-hidden !rounded-t-none rounded-b-md p-0 shadow-none ring-0"
              side="bottom"
              align="start"
              sideOffset={0}
            >
              <div className="bg-input/30 p-1">
                <CasePickerItems
                  cases={cases}
                  activeId={activeId}
                  onSelect={selectCase}
                />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
        <CaseNavLinks caseSlug={active?.slug} collapsed={collapsed} />
      </SidebarMenu>
    </>
  );
}

/** Sidebar workspace control — active Case (cookie) + switcher + case nav. */
export function CaseSwitcher() {
  return (
    <Suspense fallback={<CaseSwitcherSkeleton />}>
      <CaseSwitcherReady />
    </Suspense>
  );
}
