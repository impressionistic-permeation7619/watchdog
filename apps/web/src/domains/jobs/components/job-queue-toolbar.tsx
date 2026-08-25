import type { ReactNode } from "react";

import type { JobListRecord } from "@/domains/jobs/jobs.functions";
import {
  EMPTY_JOB_FILTERS,
  STATUS_FACET_OPTIONS,
  capabilityFacetOptions,
  type JobQueueFilters,
} from "@/domains/jobs/lib/status";
import {
  PageFilterMenu,
  type PageFilterChip,
} from "@/shared/layout/page-filter-menu";
import { PageToolbar } from "@/shared/layout/page-toolbar";
import { QueueFilterBar } from "@/shared/ui/queue-filter-bar";
import { Checkbox } from "@/shared/ui/shadcn/checkbox";
import { Label } from "@/shared/ui/shadcn/label";

interface JobQueueToolbarProps {
  jobs: JobListRecord[];
  filters: JobQueueFilters;
  onFiltersChange: (next: JobQueueFilters) => void;
  runSlot?: ReactNode;
}

/**
 * Jobs chrome strip — queue search/filters + optional Run form slot.
 */
export function JobQueueToolbar({
  jobs,
  filters,
  onFiltersChange,
  runSlot,
}: JobQueueToolbarProps) {
  const capOptions = capabilityFacetOptions(jobs);
  const selectedStatuses = new Set(filters.statuses);
  const selectedCapabilityIds = new Set(filters.capabilityIds);

  const filterChips: PageFilterChip[] = [
    ...filters.statuses.map((status) => ({
      id: `status:${status}`,
      label:
        STATUS_FACET_OPTIONS.find((o) => o.value === status)?.label ?? status,
      onClear: () => {
        onFiltersChange({
          ...filters,
          statuses: filters.statuses.filter((s) => s !== status),
        });
      },
    })),
    ...filters.capabilityIds.map((id) => ({
      id: `cap:${id}`,
      label: capOptions.find((o) => o.value === id)?.label ?? id,
      onClear: () => {
        onFiltersChange({
          ...filters,
          capabilityIds: filters.capabilityIds.filter((c) => c !== id),
        });
      },
    })),
  ];

  return (
    <div className="flex shrink-0 flex-col gap-1">
      <PageToolbar
        center={
          <>
            <QueueFilterBar
              value={filters.q}
              onValueChange={(q) => {
                onFiltersChange({ ...filters, q });
              }}
              placeholder="Search capability, target, id…"
              aria-label="Search jobs"
              filtersActive={filterChips.length > 0}
              onReset={() => {
                onFiltersChange(EMPTY_JOB_FILTERS);
              }}
            />
            <PageFilterMenu
              chips={filterChips}
              onClearAll={() => {
                onFiltersChange({ ...EMPTY_JOB_FILTERS, q: filters.q });
              }}
              contentClassName="w-[18rem]"
            >
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="flex flex-col gap-2">
                  {STATUS_FACET_OPTIONS.map((opt) => {
                    const checked = selectedStatuses.has(opt.value);
                    return (
                      <label
                        key={opt.value}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(value) => {
                            onFiltersChange({
                              ...filters,
                              statuses: value
                                ? [...filters.statuses, opt.value]
                                : filters.statuses.filter(
                                    (s) => s !== opt.value
                                  ),
                            });
                          }}
                        />
                        {opt.label}
                      </label>
                    );
                  })}
                </div>
              </div>
              {capOptions.length > 0 ? (
                <div className="space-y-2">
                  <Label>Capability</Label>
                  <div className="flex max-h-40 flex-col gap-2 overflow-y-auto">
                    {capOptions.map((opt) => {
                      const checked = selectedCapabilityIds.has(opt.value);
                      return (
                        <label
                          key={opt.value}
                          className="flex cursor-pointer items-center gap-2 text-sm"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) => {
                              onFiltersChange({
                                ...filters,
                                capabilityIds: value
                                  ? [...filters.capabilityIds, opt.value]
                                  : filters.capabilityIds.filter(
                                      (c) => c !== opt.value
                                    ),
                              });
                            }}
                          />
                          <span className="font-mono text-xs">{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </PageFilterMenu>
          </>
        }
        trailing={runSlot}
      />
    </div>
  );
}
