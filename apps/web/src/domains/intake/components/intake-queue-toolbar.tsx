import { ClipboardPasteIcon, FileUpIcon, LinkIcon } from "lucide-react";
import { useId } from "react";

import {
  EMPTY_INTAKE_FILTERS,
  intakeFiltersActive,
  type IntakeQueueFilters,
} from "@/domains/intake/lib/filters";
import {
  PageFilterMenu,
  type PageFilterChip,
} from "@/shared/layout/page-filter-menu";
import { PageToolbar } from "@/shared/layout/page-toolbar";
import { EntityCombobox, type EntityOption } from "@/shared/ui/entity-combobox";
import { QueueFilterBar } from "@/shared/ui/queue-filter-bar";
import { Button } from "@/shared/ui/shadcn/button";
import { ButtonGroup } from "@/shared/ui/shadcn/button-group";
import { Checkbox } from "@/shared/ui/shadcn/checkbox";
import { FieldLabel } from "@/shared/ui/shadcn/field";
import { Label } from "@/shared/ui/shadcn/label";

export type { EntityOption } from "@/shared/ui/entity-combobox";

export interface IntakeQueueToolbarProps {
  entities: EntityOption[];
  entityId: string;
  onEntityIdChange: (id: string) => void;
  filters: IntakeQueueFilters;
  onFiltersChange: (next: IntakeQueueFilters) => void;
  dumpDisabled?: boolean;
  onDump: (kind: "file" | "paste" | "url") => void;
}

export function IntakeQueueToolbar({
  entities,
  entityId,
  onEntityIdChange,
  filters,
  onFiltersChange,
  dumpDisabled,
  onDump,
}: IntakeQueueToolbarProps) {
  const hiddenOnlyId = useId();
  const unprocessedOnlyId = useId();
  const unattachedOnlyId = useId();

  const filterChips: PageFilterChip[] = [
    ...(filters.hiddenOnly
      ? [
          {
            id: "hidden",
            label: "Hidden",
            onClear: () => {
              onFiltersChange({ ...filters, hiddenOnly: false });
            },
          },
        ]
      : []),
    ...(filters.unprocessedOnly
      ? [
          {
            id: "unprocessed",
            label: "Unprocessed",
            onClear: () => {
              onFiltersChange({ ...filters, unprocessedOnly: false });
            },
          },
        ]
      : []),
    ...(filters.unattachedOnly
      ? [
          {
            id: "unattached",
            label: "Unattached",
            onClear: () => {
              onFiltersChange({ ...filters, unattachedOnly: false });
            },
          },
        ]
      : []),
  ];

  return (
    <PageToolbar
      center={
        <>
          <QueueFilterBar
            value={filters.q}
            onValueChange={(q) => {
              onFiltersChange({ ...filters, q });
            }}
            placeholder="Search label, kind, id…"
            aria-label="Search evidence"
            filtersActive={intakeFiltersActive(filters)}
            onReset={() => {
              onFiltersChange(EMPTY_INTAKE_FILTERS);
            }}
          />
          <PageFilterMenu
            chips={filterChips}
            onClearAll={() => {
              onFiltersChange({ ...EMPTY_INTAKE_FILTERS, q: filters.q });
            }}
            contentClassName="w-[16rem]"
          >
            <div className="space-y-2">
              <Label>Show only</Label>
              <div className="flex flex-col gap-2">
                <label
                  htmlFor={hiddenOnlyId}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <Checkbox
                    id={hiddenOnlyId}
                    checked={filters.hiddenOnly}
                    onCheckedChange={(value) => {
                      onFiltersChange({
                        ...filters,
                        hiddenOnly: value,
                      });
                    }}
                  />
                  Hidden
                </label>
                <label
                  htmlFor={unprocessedOnlyId}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <Checkbox
                    id={unprocessedOnlyId}
                    checked={filters.unprocessedOnly}
                    onCheckedChange={(value) => {
                      onFiltersChange({
                        ...filters,
                        unprocessedOnly: value,
                      });
                    }}
                  />
                  Unprocessed
                </label>
                <label
                  htmlFor={unattachedOnlyId}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <Checkbox
                    id={unattachedOnlyId}
                    checked={filters.unattachedOnly}
                    onCheckedChange={(value) => {
                      onFiltersChange({
                        ...filters,
                        unattachedOnly: value,
                      });
                    }}
                  />
                  Unattached
                </label>
              </div>
            </div>
          </PageFilterMenu>
        </>
      }
      trailing={
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
          <FieldLabel className="sr-only">Target entity</FieldLabel>
          <EntityCombobox
            entities={entities}
            value={entityId}
            onValueChange={onEntityIdChange}
            emptyLabel="Unattached"
            aria-label="Target entity"
            className="w-56"
          />
          <ButtonGroup aria-label="Dump evidence">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              disabled={dumpDisabled}
              onClick={() => {
                onDump("file");
              }}
            >
              <FileUpIcon data-icon="inline-start" />
              File
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              disabled={dumpDisabled}
              onClick={() => {
                onDump("paste");
              }}
            >
              <ClipboardPasteIcon data-icon="inline-start" />
              Paste
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              disabled={dumpDisabled}
              onClick={() => {
                onDump("url");
              }}
            >
              <LinkIcon data-icon="inline-start" />
              URL
            </Button>
          </ButtonGroup>
        </div>
      }
    />
  );
}
