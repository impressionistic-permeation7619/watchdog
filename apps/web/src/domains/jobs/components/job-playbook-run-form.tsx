import { useForm } from "@tanstack/react-form";
import { Link } from "@tanstack/react-router";
import { InfoIcon } from "lucide-react";
import type { SubmitEvent } from "react";
import { useEffect } from "react";

import { clampSelectId } from "@/domains/jobs/lib/clamp-select";
import { buildPlaybookSeedView } from "@/domains/jobs/lib/playbook-seed-view";
import type { PlaybookListItem } from "@/domains/jobs/types";
import { EntityCombobox, type EntityOption } from "@/shared/ui/entity-combobox";
import { FieldSelect } from "@/shared/ui/field-select";
import { FormInlineError } from "@/shared/ui/form-inline-message";
import { Button } from "@/shared/ui/shadcn/button";
import { Input } from "@/shared/ui/shadcn/input";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/shared/ui/shadcn/popover";
import { WithTooltip } from "@/shared/ui/timestamp";
import { trimmedOrUndefined, type PlaybookSeedKind } from "@watchdog/schemas";

export interface UrlDumpOption {
  id: string;
  sourceUrl: string;
  label?: string | null;
}

interface PlaybookRunFormValues {
  playbookId: string;
  host: string;
  url: string;
  evidenceId: string;
  entityId: string;
  ip: string;
  email: string;
  hash: string;
  handle: string;
}

const SEED_TEXT_FIELDS = [
  {
    kind: "host",
    name: "host",
    placeholder: "example.com",
    label: "Seed host",
    className: "h-8 min-w-[8rem] flex-1 text-xs sm:max-w-[10rem]",
  },
  {
    kind: "ip",
    name: "ip",
    placeholder: "1.2.3.4",
    label: "Seed IP",
    className: "h-8 min-w-[8rem] flex-1 font-mono text-xs sm:max-w-[10rem]",
  },
  {
    kind: "email",
    name: "email",
    placeholder: "name@example.com",
    label: "Seed email",
    className: "h-8 min-w-[10rem] flex-1 text-xs sm:max-w-[14rem]",
  },
  {
    kind: "hash",
    name: "hash",
    placeholder: "sha256…",
    label: "Seed hash",
    className: "h-8 min-w-[10rem] flex-1 font-mono text-xs sm:max-w-[16rem]",
  },
  {
    kind: "handle",
    name: "handle",
    placeholder: "username",
    label: "Seed handle",
    className: "h-8 min-w-[8rem] flex-1 text-xs sm:max-w-[10rem]",
  },
] as const satisfies readonly {
  kind: PlaybookSeedKind;
  name: keyof PlaybookRunFormValues;
  placeholder: string;
  label: string;
  className: string;
}[];

export interface PlaybookRunVars {
  playbookId: string;
  host: string;
  url: string;
  evidenceId: string;
  entityId: string;
  ip: string;
  email: string;
  hash: string;
  handle: string;
}

interface JobPlaybookRunFormProps {
  playbooks: PlaybookListItem[];
  /** Intake URL dumps — picking one fills evidenceId + url. */
  urlDumps: UrlDumpOption[];
  entities: EntityOption[];
  allowThirdPartyEgress: boolean;
  configuredCredentials: ReadonlySet<string>;
  runError?: string | null;
  onRunPlaybook: (vars: PlaybookRunVars) => Promise<void>;
}

function PlaybookInfoPopover({
  selected,
  needsEgress,
  showEgressRow,
  egressLabel,
}: {
  selected: PlaybookListItem | undefined;
  needsEgress: boolean;
  showEgressRow: boolean;
  egressLabel: string;
}) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className={
              needsEgress
                ? "text-warning size-8 shrink-0"
                : "text-muted-foreground size-8 shrink-0"
            }
            aria-label="Playbook details"
            disabled={!selected}
          />
        }
      >
        <InfoIcon className="size-3.5" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 gap-2">
        <PopoverHeader>
          <PopoverTitle>{selected?.title}</PopoverTitle>
          {selected?.description ? (
            <PopoverDescription>{selected.description}</PopoverDescription>
          ) : null}
        </PopoverHeader>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
          <dt className="text-muted-foreground">Id</dt>
          <dd className="font-mono text-[0.65rem]">{selected?.id}</dd>
          <dt className="text-muted-foreground">Steps</dt>
          <dd className="font-mono text-[0.65rem] leading-snug">
            {selected?.steps.join(" → ")}
          </dd>
          {showEgressRow ? (
            <>
              <dt className="text-muted-foreground">Egress</dt>
              <dd>{egressLabel}</dd>
            </>
          ) : null}
        </dl>
      </PopoverContent>
    </Popover>
  );
}

export function JobPlaybookRunForm({
  playbooks,
  urlDumps,
  entities,
  allowThirdPartyEgress,
  configuredCredentials,
  runError,
  onRunPlaybook,
}: JobPlaybookRunFormProps) {
  const form = useForm({
    defaultValues: {
      playbookId: playbooks[0]?.id ?? "host-footprint",
      host: "",
      url: "",
      evidenceId: "",
      entityId: "",
      ip: "",
      email: "",
      hash: "",
      handle: "",
    } satisfies PlaybookRunFormValues,
    onSubmit: async ({ value }) => {
      try {
        await onRunPlaybook(value);
        form.reset({
          playbookId: value.playbookId,
          host: "",
          url: "",
          evidenceId: "",
          entityId: "",
          ip: "",
          email: "",
          hash: "",
          handle: "",
        });
      } catch {
        // Parent sets runError via onRunPlaybook.
      }
    },
  });

  useEffect(() => {
    const current = form.getFieldValue("playbookId");
    const next = clampSelectId(
      current,
      playbooks.map((p) => p.id)
    );
    if (next !== null && next !== current) {
      form.setFieldValue("playbookId", next);
    }
  }, [playbooks, form]);

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    e.stopPropagation();
    void form.handleSubmit();
  }

  return (
    <div className="flex max-w-full min-w-0 flex-col items-end gap-1">
      <form
        className="flex min-w-0 flex-wrap items-center justify-end gap-2"
        onSubmit={handleSubmit}
        aria-label="Run playbook"
      >
        <form.Subscribe
          selector={(state) => ({
            playbookId: state.values.playbookId,
            host: state.values.host,
            url: state.values.url,
            evidenceId: state.values.evidenceId,
            ip: state.values.ip,
            email: state.values.email,
            hash: state.values.hash,
            handle: state.values.handle,
            isSubmitting: state.isSubmitting,
          })}
        >
          {({
            playbookId,
            host,
            url,
            evidenceId,
            ip,
            email,
            hash,
            handle,
            isSubmitting,
          }) => {
            const view = buildPlaybookSeedView({
              playbooks,
              playbookId,
              host,
              url,
              evidenceId,
              ip,
              email,
              hash,
              handle,
              urlDumpCount: urlDumps.length,
              allowThirdPartyEgress,
              configuredCredentials,
            });

            return (
              <>
                <div className="flex shrink-0 items-center gap-0.5">
                  <form.Field name="playbookId">
                    {(field) => (
                      <FieldSelect
                        className="w-48"
                        value={field.state.value}
                        onValueChange={(id) => {
                          field.handleChange(id);
                        }}
                        aria-label="Playbook"
                        disabled={playbooks.length === 0}
                        placeholder="Select playbook…"
                        options={playbooks.map((p) => ({
                          value: p.id,
                          label: p.title,
                        }))}
                      />
                    )}
                  </form.Field>
                  <PlaybookInfoPopover
                    selected={view.selected}
                    needsEgress={view.needsEgress}
                    showEgressRow={view.showEgressRow}
                    egressLabel={view.egressLabel}
                  />
                </div>
                {SEED_TEXT_FIELDS.filter((field) =>
                  view.needs.includes(field.kind)
                ).map((spec) => (
                  <form.Field key={spec.name} name={spec.name}>
                    {(field) => (
                      <Input
                        className={spec.className}
                        placeholder={spec.placeholder}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => {
                          field.handleChange(e.target.value);
                        }}
                        aria-label={spec.label}
                      />
                    )}
                  </form.Field>
                ))}
                {view.pickUrlDump ? (
                  <form.Field name="evidenceId">
                    {(field) => (
                      <FieldSelect
                        className="min-w-[12rem] flex-1 sm:max-w-xs"
                        value={field.state.value}
                        onValueChange={(id) => {
                          field.handleChange(id);
                          const row = urlDumps.find((d) => d.id === id);
                          form.setFieldValue("url", row?.sourceUrl ?? "");
                        }}
                        aria-label="URL dump Evidence"
                        disabled={urlDumps.length === 0}
                        placeholder="Select URL dump…"
                        options={urlDumps.map((d) => ({
                          value: d.id,
                          label: trimmedOrUndefined(d.label) ?? d.sourceUrl,
                        }))}
                      />
                    )}
                  </form.Field>
                ) : (
                  <>
                    {view.needsUrl ? (
                      <form.Field name="url">
                        {(field) => (
                          <Input
                            className="h-8 min-w-[10rem] flex-1 text-xs sm:max-w-xs"
                            placeholder="https://example.com"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => {
                              field.handleChange(e.target.value);
                            }}
                            aria-label="Seed URL"
                          />
                        )}
                      </form.Field>
                    ) : null}
                    {view.needsEvidence ? (
                      <form.Field name="evidenceId">
                        {(field) => (
                          <Input
                            className="h-8 min-w-[12rem] flex-1 font-mono text-xs sm:max-w-xs"
                            placeholder="Evidence id"
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => {
                              field.handleChange(e.target.value);
                            }}
                            aria-label="Seed Evidence id"
                          />
                        )}
                      </form.Field>
                    ) : null}
                  </>
                )}
                <form.Field name="entityId">
                  {(field) => (
                    <EntityCombobox
                      entities={entities}
                      value={field.state.value}
                      onValueChange={(id) => {
                        field.handleChange(id);
                      }}
                      emptyLabel="No entity"
                      aria-label="Attach to entity"
                      hideWhenEmpty
                    />
                  )}
                </form.Field>
                <WithTooltip
                  wrapSpan={!view.canRun}
                  content={
                    view.missingCredentials !== undefined &&
                    view.blockedReason !== undefined ? (
                      <>
                        {view.blockedReason}{" "}
                        <Link
                          to="/settings"
                          search={{ tab: "credentials" }}
                          className="underline underline-offset-2"
                        >
                          Open Settings
                        </Link>
                      </>
                    ) : (
                      view.blockedReason
                    )
                  }
                >
                  <Button
                    type="submit"
                    size="sm"
                    className="h-8 text-xs"
                    loading={isSubmitting}
                    disabled={!view.canRun || isSubmitting}
                  >
                    Run Playbook
                  </Button>
                </WithTooltip>
              </>
            );
          }}
        </form.Subscribe>
      </form>
      <FormInlineError className="max-w-md text-right">
        {runError}
      </FormInlineError>
    </div>
  );
}
