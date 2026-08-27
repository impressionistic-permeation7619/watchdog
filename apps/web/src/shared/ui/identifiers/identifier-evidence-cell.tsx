import { useState } from "react";

import { IdChip } from "@/shared/ui/id-chip";
import type { EvidenceOption } from "@/shared/ui/intake/evidence-option";
import { EvidencePicker } from "@/shared/ui/intake/evidence-picker";
import { Button } from "@/shared/ui/shadcn/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/shared/ui/shadcn/popover";

export interface IdentifierEvidenceRow {
  id: string;
  evidenceIds: string[];
}

export function IdentifierEvidenceCell({
  row,
  evidenceOptions,
  onEvidenceClick,
  saveEvidence,
}: {
  row: IdentifierEvidenceRow;
  evidenceOptions: EvidenceOption[];
  onEvidenceClick?: (evidenceId: string) => void;
  saveEvidence: (
    identifierId: string,
    evidenceIds: string[]
  ) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editEvidenceIds, setEditEvidenceIds] = useState<string[]>(
    row.evidenceIds
  );

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setEditEvidenceIds(row.evidenceIds);
        }
        setOpen(nextOpen);
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 max-w-full gap-1 px-1 text-xs font-normal"
            onClick={(e) => {
              e.stopPropagation();
            }}
          />
        }
      >
        {row.evidenceIds.length > 0 ? (
          <span className="flex flex-wrap gap-0.5">
            {row.evidenceIds.map((id) => (
              <IdChip
                key={id}
                value={id}
                head={8}
                tail={0}
                className="pointer-events-none"
              />
            ))}
          </span>
        ) : (
          <span className="text-muted-foreground">Link…</span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 gap-2"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <PopoverHeader>
          <PopoverTitle className="text-xs">Evidence</PopoverTitle>
        </PopoverHeader>
        <EvidencePicker
          options={evidenceOptions}
          selectedIds={editEvidenceIds}
          onChange={setEditEvidenceIds}
        />
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 text-xs"
            onClick={() => {
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="h-6 text-xs"
            loading={saving}
            onClick={() => {
              void (async () => {
                setSaving(true);
                try {
                  await saveEvidence(row.id, editEvidenceIds);
                  setOpen(false);
                } catch {
                  // Parent toasts; keep popover open for retry.
                } finally {
                  setSaving(false);
                }
              })();
            }}
          >
            Save
          </Button>
        </div>
        {onEvidenceClick && row.evidenceIds.length > 0 ? (
          <p className="text-muted-foreground text-xs">
            Click a chip in the table after save to open Intake.
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
