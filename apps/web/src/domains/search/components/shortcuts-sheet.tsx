import { HOTKEYS, modKeyLabel } from "@/shared/lib/hotkeys";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/shadcn/dialog";
import { Kbd, KbdGroup } from "@/shared/ui/shadcn/kbd";

interface ShortcutsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ChordDisplay({ chord }: { chord: string }) {
  const mod = modKeyLabel();
  if (chord.startsWith("Mod+")) {
    const rest = chord.slice("Mod+".length);
    return (
      <KbdGroup>
        <Kbd>{mod}</Kbd>
        <Kbd>{rest}</Kbd>
      </KbdGroup>
    );
  }
  return <Kbd>{chord}</Kbd>;
}

export function ShortcutsSheet({ open, onOpenChange }: ShortcutsSheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Mod+K then type to search the Active Case or jump to a page.
          </DialogDescription>
        </DialogHeader>
        <ul className="flex flex-col gap-3">
          {HOTKEYS.map((entry) => (
            <li
              key={entry.id}
              className="flex items-start justify-between gap-4 text-sm"
            >
              <div className="min-w-0">
                <div className="font-medium">{entry.label}</div>
                <div className="text-muted-foreground">{entry.description}</div>
              </div>
              <ChordDisplay chord={entry.chord} />
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
