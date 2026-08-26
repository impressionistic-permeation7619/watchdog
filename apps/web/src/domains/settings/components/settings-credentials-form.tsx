import { useForm } from "@tanstack/react-form";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Eye, EyeOff, KeyRoundIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { credentialsListQuery } from "@/domains/settings/queries";
import {
  deleteCredentialFn,
  putCredentialFn,
} from "@/domains/settings/settings.functions";
import { cn, errMessage } from "@/lib/utils";
import { invalidateAfterCredentialMutation } from "@/shared/lib/query-invalidation";
import { DestructiveConfirmDialog } from "@/shared/ui/destructive-confirm-dialog";
import { FormInlineError } from "@/shared/ui/form-inline-message";
import { SETTINGS_CARD_SURFACE } from "@/shared/ui/form-section";
import { LocalDateTime } from "@/shared/ui/local-date-time";
import { Alert, AlertDescription } from "@/shared/ui/shadcn/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/shared/ui/shadcn/alert-dialog";
import { Button } from "@/shared/ui/shadcn/button";
import { Card, CardContent } from "@/shared/ui/shadcn/card";
import { Field, FieldLabel } from "@/shared/ui/shadcn/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/shared/ui/shadcn/input-group";
import { Separator } from "@/shared/ui/shadcn/separator";
import { Spinner } from "@/shared/ui/shadcn/spinner";
import { StatusDot } from "@/shared/ui/status-dot";
import type { CredentialSlot } from "@watchdog/core";

function CredentialSlotRow({
  slot,
  onConfigure,
  onDelete,
}: {
  slot: CredentialSlot;
  onConfigure: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <StatusDot
        status={slot.configured ? "succeeded" : "queued"}
        tooltip={false}
        className="mt-0.5"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-sm leading-tight font-medium">
          {slot.label}
        </span>
        {slot.updatedAt ? (
          <p className="text-muted-foreground text-xs leading-snug">
            Updated <LocalDateTime value={slot.updatedAt} />
          </p>
        ) : null}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <Button type="button" size="sm" variant="outline" onClick={onConfigure}>
          {slot.configured ? "Update" : "Connect"}
        </Button>
        {slot.configured ? (
          <Button type="button" size="sm" variant="ghost" onClick={onDelete}>
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function CredentialSlotGroup({
  title,
  slots,
  onConfigure,
  onDelete,
}: {
  title: string;
  slots: CredentialSlot[];
  onConfigure: (name: string) => void;
  onDelete: (name: string) => void;
}) {
  if (slots.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {title}
      </h3>
      <Card className={cn(SETTINGS_CARD_SURFACE, "gap-0 p-0 py-0")}>
        <CardContent className="p-0">
          {slots.map((slot, index) => (
            <div key={slot.name}>
              {index > 0 ? <Separator /> : null}
              <CredentialSlotRow
                slot={slot}
                onConfigure={() => {
                  onConfigure(slot.name);
                }}
                onDelete={() => {
                  onDelete(slot.name);
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function ConfigureCredentialDialog({
  slot,
  open,
  onOpenChange,
  onSaved,
  onError,
}: {
  slot: CredentialSlot | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  onError: (message: string) => void;
}) {
  const [secretVisible, setSecretVisible] = useState(false);
  const configured = slot?.configured ?? false;

  const form = useForm({
    defaultValues: { secret: "" },
    onSubmit: async ({ value }) => {
      if (!slot) return;
      const secret = value.secret.trim();
      if (!secret) return;
      try {
        await putCredentialFn({ data: { name: slot.name, secret } });
        form.reset();
        setSecretVisible(false);
        onOpenChange(false);
        onSaved();
      } catch (error) {
        onError(errMessage(error, "Save failed"));
      }
    },
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      form.reset();
      setSecretVisible(false);
    }
    onOpenChange(next);
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="data-[size=default]:sm:max-w-md">
        <form
          className="flex flex-col gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            void form.handleSubmit();
          }}
        >
          <AlertDialogHeader>
            <AlertDialogMedia>
              <KeyRoundIcon />
            </AlertDialogMedia>
            <AlertDialogTitle>
              {configured
                ? `Update ${slot?.label ?? "credential"}`
                : `Connect ${slot?.label ?? "credential"}`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {slot?.description ??
                "Paste the provider secret. Caps read it at runtime from the vault."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {slot ? (
            <div className="bg-muted/40 ring-foreground/8 flex items-center gap-2.5 rounded-md px-3 py-2.5 ring-1">
              <StatusDot
                status={configured ? "succeeded" : "queued"}
                tooltip={false}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{slot.label}</p>
                <p className="text-muted-foreground text-label-mono-sm truncate">
                  {slot.name}
                </p>
              </div>
              {configured && slot.updatedAt ? (
                <p className="text-muted-foreground text-label-mono-sm shrink-0">
                  Updated <LocalDateTime value={slot.updatedAt} />
                </p>
              ) : (
                <p className="text-muted-foreground text-label-mono-sm shrink-0">
                  Not connected
                </p>
              )}
            </div>
          ) : null}

          <form.Field
            name="secret"
            validators={{
              onSubmit: ({ value }) =>
                value.trim() ? undefined : "Enter a secret before saving",
            }}
          >
            {(field) => (
              <Field data-invalid={!!field.state.meta.errors[0]}>
                <FieldLabel htmlFor="credential-secret">
                  {configured ? "New secret" : "API key / secret"}
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id="credential-secret"
                    type={secretVisible ? "text" : "password"}
                    autoComplete="off"
                    autoFocus
                    placeholder={configured ? "••••••••" : "Paste secret…"}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => {
                      field.handleChange(e.target.value);
                    }}
                    disabled={form.state.isSubmitting}
                    aria-invalid={!!field.state.meta.errors[0]}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      type="button"
                      size="icon-xs"
                      aria-label={secretVisible ? "Hide secret" : "Show secret"}
                      onClick={() => {
                        setSecretVisible((v) => !v);
                      }}
                      disabled={form.state.isSubmitting}
                    >
                      {secretVisible ? <EyeOff /> : <Eye />}
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <FormInlineError>{field.state.meta.errors[0]}</FormInlineError>
              </Field>
            )}
          </form.Field>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={form.state.isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <form.Subscribe
              selector={(state) => ({
                canSubmit: state.canSubmit,
                isSubmitting: state.isSubmitting,
                secret: state.values.secret,
              })}
            >
              {({ canSubmit, isSubmitting, secret }) => (
                <Button
                  type="submit"
                  disabled={isSubmitting || !canSubmit || !secret.trim()}
                >
                  {isSubmitting ? <Spinner /> : null}
                  {configured ? "Save secret" : "Connect"}
                </Button>
              )}
            </form.Subscribe>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function SettingsCredentialsForm() {
  const queryClient = useQueryClient();
  const { data: slots } = useSuspenseQuery(credentialsListQuery());

  const [error, setError] = useState<string | null>(null);
  const [configureName, setConfigureName] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (name: string) => deleteCredentialFn({ data: { name } }),
    onSuccess: async () => {
      toast.success("Credential removed");
      setDeleteTarget(null);
      await invalidateAfterCredentialMutation(queryClient);
    },
    onError: (e) => {
      setDeleteError(errMessage(e, "Delete failed"));
    },
  });

  const configureSlot = slots.find((s) => s.name === configureName) ?? null;
  const deleteSlot = slots.find((s) => s.name === deleteTarget) ?? null;
  const connected = slots.filter((s) => s.configured);
  const disconnected = slots.filter((s) => !s.configured);

  function openConfigure(name: string) {
    setError(null);
    setConfigureName(name);
  }

  function openDelete(name: string) {
    setDeleteError(null);
    setDeleteTarget(name);
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {slots.length === 0 ? (
        <Card className={cn(SETTINGS_CARD_SURFACE, "gap-0 p-0 py-0")}>
          <CardContent className="text-muted-foreground flex flex-col items-center gap-2 px-4 py-10 text-center text-sm">
            <KeyRoundIcon className="size-5" />
            No Cap credential slots registered.
          </CardContent>
        </Card>
      ) : (
        <>
          <CredentialSlotGroup
            title="Connected"
            slots={connected}
            onConfigure={openConfigure}
            onDelete={openDelete}
          />
          <CredentialSlotGroup
            title="Not connected"
            slots={disconnected}
            onConfigure={openConfigure}
            onDelete={openDelete}
          />
        </>
      )}

      <ConfigureCredentialDialog
        key={configureName ?? "closed"}
        slot={configureSlot}
        open={configureName !== null}
        onOpenChange={(open) => {
          if (!open) setConfigureName(null);
        }}
        onSaved={() => {
          setError(null);
          toast.success("Credential saved");
          void invalidateAfterCredentialMutation(queryClient);
        }}
        onError={(message) => {
          setError(message);
        }}
      />

      <DestructiveConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
        title="Remove credential"
        description={
          deleteSlot
            ? `Remove the stored secret for ${deleteSlot.label}. Caps that need it will fail until you reconnect.`
            : undefined
        }
        confirmLabel="Remove credential"
        verificationPhrase={deleteSlot?.name ?? ""}
        verificationLabel="Type the credential name"
        irreversibility="Removing this credential cannot be undone."
        media={<KeyRoundIcon />}
        loading={deleteMutation.isPending}
        error={deleteError}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget);
        }}
      />
    </div>
  );
}
