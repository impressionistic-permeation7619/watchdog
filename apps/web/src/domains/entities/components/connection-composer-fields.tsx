import type { ConnectionComposerValues } from "@/domains/entities/lib/connection-composer";
import { EntityCombobox, type EntityOption } from "@/shared/ui/entity-combobox";
import { FieldCombobox } from "@/shared/ui/field-combobox";
import { Input } from "@/shared/ui/shadcn/input";
import { Label } from "@/shared/ui/shadcn/label";
import {
  clampEdgePhrase,
  edgePhraseOptions,
  edgePhraseValue,
  parseEdgePhraseValue,
  preferredEdgePhrase,
} from "@/shared/ui/vocab/edge-predicate";
import type { EntityKind } from "@watchdog/schemas";

interface Props {
  centerKind: EntityKind;
  peerOptions: readonly EntityOption[];
  values: ConnectionComposerValues;
  onChange: (next: ConnectionComposerValues) => void;
  disabled?: boolean;
}

/**
 * Compact relationship + peer + related_to notes fields.
 * Shared by Entities table popover (dossier keeps full Dialog form).
 */
export function ConnectionComposerFields({
  centerKind,
  peerOptions,
  values,
  onChange,
  disabled = false,
}: Props) {
  const peer = peerOptions.find((o) => o.id === values.peerId);
  const phraseOptions = edgePhraseOptions(
    peer?.kind
      ? { fromKind: centerKind, toKind: peer.kind }
      : { fromKind: centerKind }
  );
  const needsNotes =
    parseEdgePhraseValue(values.phraseValue)?.predicate === "related_to";

  function setPeer(peerId: string) {
    const nextPeer = peerOptions.find((o) => o.id === peerId);
    if (!nextPeer?.kind) {
      onChange({ ...values, peerId, phraseValue: "" });
      return;
    }
    const peerKind = nextPeer.kind;
    const parsed = parseEdgePhraseValue(values.phraseValue);
    if (parsed) {
      const clamped = clampEdgePhrase(
        centerKind,
        peerKind,
        parsed.predicate,
        parsed.orientation
      );
      onChange({
        ...values,
        peerId,
        phraseValue: edgePhraseValue(clamped.predicate, clamped.orientation),
      });
      return;
    }
    const preferred = preferredEdgePhrase(centerKind, peerKind);
    onChange({
      ...values,
      peerId,
      phraseValue: preferred?.value ?? "",
    });
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Relationship</Label>
        <FieldCombobox
          value={values.phraseValue}
          onValueChange={(phraseValue) => {
            onChange({ ...values, phraseValue });
          }}
          options={phraseOptions}
          placeholder="Search relationships…"
          emptyText="No matching relationships."
          disabled={disabled}
          className="w-full"
          aria-label="Connection relationship"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs">Peer</Label>
        <EntityCombobox
          entities={[...peerOptions]}
          value={values.peerId}
          onValueChange={setPeer}
          allowEmpty={false}
          emptyLabel="Select peer…"
          size="sm"
          aria-label="Connection peer"
          disabled={disabled}
        />
      </div>

      {needsNotes ? (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Notes</Label>
          <Input
            value={values.notes}
            onChange={(e) => {
              onChange({ ...values, notes: e.target.value });
            }}
            placeholder="Why related…"
            disabled={disabled}
            className="h-7 text-xs"
            aria-label="Connection notes"
          />
        </div>
      ) : null}
    </>
  );
}
