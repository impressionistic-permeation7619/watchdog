import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { KeyRoundIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfigureCredentialDialog } from "@/domains/settings/components/settings-configure-credential-dialog";
import { credentialsListQuery } from "@/domains/settings/queries";
import { deleteCredentialFn } from "@/domains/settings/settings.functions";
import { cn, errMessage } from "@/lib/utils";
import { invalidateAfterCredentialMutation } from "@/shared/lib/query-invalidation";
import { DestructiveConfirmDialog } from "@/shared/ui/destructive-confirm-dialog";
import { SETTINGS_CARD_SURFACE } from "@/shared/ui/form-section";
import { LocalDateTime } from "@/shared/ui/local-date-time";
import { Alert, AlertDescription } from "@/shared/ui/shadcn/alert";
import { Button } from "@/shared/ui/shadcn/button";
import { Card, CardContent } from "@/shared/ui/shadcn/card";
import { Separator } from "@/shared/ui/shadcn/separator";
import { StatusDot } from "@/shared/ui/status-dot";
import type { CredentialSlot } from "@watchdog/core";

function CredentialSlotRow({
  slot,
  onConfigure,
  onDelete,
}: {
  slot: CredentialSlot;
  onConfigure: (name: string) => void;
  onDelete: (name: string) => void;
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
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onConfigure(slot.name)}
        >
          {slot.configured ? "Update" : "Connect"}
        </Button>
        {slot.configured ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onDelete(slot.name)}
          >
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
                onConfigure={onConfigure}
                onDelete={onDelete}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function closeConfigureDialog(
  open: boolean,
  setConfigureName: (name: string | null) => void
): void {
  if (!open) setConfigureName(null);
}

function closeDeleteDialog(
  open: boolean,
  pending: boolean,
  setDeleteTarget: (name: string | null) => void,
  setDeleteError: (message: string | null) => void
): void {
  if (!open && !pending) {
    setDeleteTarget(null);
    setDeleteError(null);
  }
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

  function handleCredentialSaved() {
    setError(null);
    toast.success("Credential saved");
    void invalidateAfterCredentialMutation(queryClient);
  }

  function handleDeleteConfirm() {
    if (deleteTarget) deleteMutation.mutate(deleteTarget);
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
        onOpenChange={(open) => closeConfigureDialog(open, setConfigureName)}
        onSaved={handleCredentialSaved}
        onError={setError}
      />

      <DestructiveConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) =>
          closeDeleteDialog(
            open,
            deleteMutation.isPending,
            setDeleteTarget,
            setDeleteError
          )
        }
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
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
