/* oxlint-disable react/only-export-components, react-doctor/only-export-components -- create defaults + form hook shared with IdentifiersSection */

import { useForm } from "@tanstack/react-form";

import {
  CONFIRMED_REQUIRES_EVIDENCE,
  isConfirmedBlocked,
} from "@/shared/lib/confirmed-evidence";
import {
  DataTableComposerActions,
  DataTableComposerRow,
  EditableSelectCell,
  EditableSuggestCell,
  EditableTextCell,
} from "@/shared/ui/data-table";
import { EntityCombobox, type EntityOption } from "@/shared/ui/entity-combobox";
import { FormInlineWarning } from "@/shared/ui/form-inline-message";
import {
  HANDLE_REQUIRES_PLATFORM,
  isHandleWithoutPlatform,
  PLATFORM_OPTIONS,
  STATUS_OPTIONS,
  TYPE_OPTIONS,
} from "@/shared/ui/identifiers/identifier-cells";
import type { EvidenceOption } from "@/shared/ui/intake/evidence-option";
import { EvidencePicker } from "@/shared/ui/intake/evidence-picker";
import { TableCell } from "@/shared/ui/shadcn/table";
import { CONFIDENCE_OPTIONS } from "@/shared/ui/vocab";
import {
  confidenceTierSchema,
  identifierStatusSchema,
  identifierTypeSchema,
  normalizeIdentifierPlatform,
  validateIdentifierWrite,
  type ConfidenceTier,
  type IdentifierStatus,
  type IdentifierType,
} from "@watchdog/schemas";

export const IDENTIFIER_CREATE_DEFAULTS = {
  entityId: "",
  type: "email" as IdentifierType,
  value: "",
  platform: "",
  status: "unknown" as IdentifierStatus,
  confidence: "unverified" as ConfidenceTier,
  evidenceIds: [] as string[],
};

export type IdentifierCreateValues = typeof IDENTIFIER_CREATE_DEFAULTS;

export function identifierCreateCanSubmit(
  values: IdentifierCreateValues,
  opts?: { requireEntity?: boolean }
): boolean {
  if (
    !validateIdentifierWrite({
      type: values.type,
      value: values.value,
      platform: values.platform,
    }).ok
  ) {
    return false;
  }
  if (opts?.requireEntity && values.entityId === "") return false;
  if (isConfirmedBlocked(values.confidence, values.evidenceIds)) return false;
  return true;
}

export function useIdentifierCreateForm(
  onSubmit: (args: {
    value: IdentifierCreateValues;
    reset: () => void;
  }) => Promise<void>
) {
  return useForm({
    defaultValues: IDENTIFIER_CREATE_DEFAULTS,
    onSubmit: async ({ value, formApi }) => {
      await onSubmit({
        value,
        reset: () => {
          formApi.reset();
        },
      });
    },
  });
}

type IdentifierCreateForm = ReturnType<typeof useIdentifierCreateForm>;

function identifierWriteError(
  type: IdentifierType,
  value: string,
  platform: string
): string | undefined {
  const written = validateIdentifierWrite({ type, value, platform });
  return written.ok ? undefined : written.message;
}

interface IdentifierComposerAppendProps {
  form: IdentifierCreateForm;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSubmit: () => void;
  onCancel: () => void;
  entityPicker?: { entities: EntityOption[] };
}

function ValueField({
  form,
  onKeyDown,
  autoFocus,
}: {
  form: IdentifierCreateForm;
  onKeyDown: (e: React.KeyboardEvent) => void;
  autoFocus: boolean;
}) {
  return (
    <TableCell>
      <form.Field
        name="value"
        validators={{
          onChangeListenTo: ["type", "platform"],
          onChange: ({ value, fieldApi }) =>
            identifierWriteError(
              fieldApi.form.getFieldValue("type"),
              value,
              fieldApi.form.getFieldValue("platform")
            ),
          onSubmit: ({ value, fieldApi }) =>
            identifierWriteError(
              fieldApi.form.getFieldValue("type"),
              value,
              fieldApi.form.getFieldValue("platform")
            ),
        }}
      >
        {(field) => (
          <EditableTextCell
            value={field.state.value}
            onCommit={(v) => {
              field.handleChange(v);
            }}
            placeholder="Value…"
            autoFocus={autoFocus}
            onKeyDown={onKeyDown}
            disabled={form.state.isSubmitting}
          />
        )}
      </form.Field>
    </TableCell>
  );
}

function TypeField({
  form,
  onKeyDown,
}: {
  form: IdentifierCreateForm;
  onKeyDown: (e: React.KeyboardEvent) => void;
}) {
  return (
    <TableCell>
      <form.Field name="type">
        {(field) => (
          <EditableSelectCell
            value={field.state.value}
            options={TYPE_OPTIONS}
            onCommit={(v) => {
              field.handleChange(identifierTypeSchema.parse(v));
            }}
            disabled={form.state.isSubmitting}
            onKeyDown={onKeyDown}
            aria-label="Type"
          />
        )}
      </form.Field>
    </TableCell>
  );
}

export function IdentifierComposerAppend({
  form,
  onKeyDown,
  onSubmit,
  onCancel,
  entityPicker,
}: IdentifierComposerAppendProps) {
  const requireEntity = entityPicker !== undefined;

  return (
    <DataTableComposerRow>
      {entityPicker ? (
        <TableCell>
          <form.Field
            name="entityId"
            validators={{
              onSubmit: ({ value }) => (value ? undefined : "Pick an entity"),
            }}
          >
            {(field) => (
              <EntityCombobox
                entities={entityPicker.entities}
                value={field.state.value}
                onValueChange={(id) => {
                  field.handleChange(id);
                }}
                allowEmpty={false}
                emptyLabel="Entity…"
                variant="cell"
                autoFocus
                disabled={form.state.isSubmitting}
                aria-label="Entity"
                onKeyDown={onKeyDown}
              />
            )}
          </form.Field>
        </TableCell>
      ) : null}
      <ValueField
        form={form}
        onKeyDown={onKeyDown}
        autoFocus={entityPicker === undefined}
      />
      <TypeField form={form} onKeyDown={onKeyDown} />
      <TableCell>
        <form.Field name="platform">
          {(field) => (
            <EditableSuggestCell
              value={field.state.value}
              options={PLATFORM_OPTIONS}
              onCommit={(v) => {
                field.handleChange(normalizeIdentifierPlatform(v));
              }}
              placeholder="Platform"
              disabled={form.state.isSubmitting}
              onKeyDown={onKeyDown}
              aria-label="Platform"
            />
          )}
        </form.Field>
      </TableCell>
      <TableCell>
        <form.Field name="status">
          {(field) => (
            <EditableSelectCell
              value={field.state.value}
              options={STATUS_OPTIONS}
              onCommit={(v) => {
                field.handleChange(identifierStatusSchema.parse(v));
              }}
              disabled={form.state.isSubmitting}
              onKeyDown={onKeyDown}
              aria-label="Status"
            />
          )}
        </form.Field>
      </TableCell>
      <TableCell>
        <form.Field name="confidence">
          {(field) => (
            <EditableSelectCell
              value={field.state.value}
              options={CONFIDENCE_OPTIONS}
              onCommit={(v) => {
                field.handleChange(confidenceTierSchema.parse(v));
              }}
              disabled={form.state.isSubmitting}
              onKeyDown={onKeyDown}
              aria-label="Confidence"
            />
          )}
        </form.Field>
      </TableCell>
      <form.Subscribe
        selector={(state) => ({
          isSubmitting: state.isSubmitting,
          values: state.values,
        })}
      >
        {({ isSubmitting, values }) => (
          <DataTableComposerActions
            busy={isSubmitting}
            canSubmit={identifierCreateCanSubmit(values, { requireEntity })}
            onSubmit={onSubmit}
            onCancel={onCancel}
            colSpan={2}
          />
        )}
      </form.Subscribe>
    </DataTableComposerRow>
  );
}

interface IdentifierComposerEvidenceProps {
  form: IdentifierCreateForm;
  evidenceOptions: EvidenceOption[];
}

export function IdentifierComposerEvidence({
  form,
  evidenceOptions,
}: IdentifierComposerEvidenceProps) {
  return (
    <div className="bg-muted/15 flex flex-col gap-1.5 rounded-md border border-dashed p-2">
      <form.Field
        name="evidenceIds"
        validators={{
          onChangeListenTo: ["confidence"],
          onChange: ({ value, fieldApi }) => {
            const confidence = fieldApi.form.getFieldValue("confidence");
            if (isConfirmedBlocked(confidence, value)) {
              return CONFIRMED_REQUIRES_EVIDENCE;
            }
            // oxlint-disable-next-line unicorn/no-useless-undefined -- TanStack Form: undefined = valid
            return undefined;
          },
        }}
      >
        {(field) => (
          <EvidencePicker
            options={evidenceOptions}
            selectedIds={field.state.value}
            onChange={(ids) => {
              field.handleChange(ids);
            }}
          />
        )}
      </form.Field>
      <form.Subscribe
        selector={(state) => ({
          confidence: state.values.confidence,
          evidenceIds: state.values.evidenceIds,
          type: state.values.type,
          platform: state.values.platform,
        })}
      >
        {({ confidence, evidenceIds, type, platform }) => (
          <>
            {isConfirmedBlocked(confidence, evidenceIds) ? (
              <FormInlineWarning>
                {CONFIRMED_REQUIRES_EVIDENCE}
              </FormInlineWarning>
            ) : null}
            {isHandleWithoutPlatform(type, platform) ? (
              <FormInlineWarning>{HANDLE_REQUIRES_PLATFORM}</FormInlineWarning>
            ) : null}
          </>
        )}
      </form.Subscribe>
    </div>
  );
}
