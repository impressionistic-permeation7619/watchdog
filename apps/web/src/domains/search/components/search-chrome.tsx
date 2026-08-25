import { Suspense, useMemo, useState, type ReactNode } from "react";

import { CommandPalette } from "@/domains/search/components/command-palette";
import { ShortcutsSheet } from "@/domains/search/components/shortcuts-sheet";
import { SearchUiContext } from "@/domains/search/hooks/use-search-ui";
import type { HotkeyBinding } from "@/shared/lib/hotkeys";
import { useGlobalHotkeys } from "@/shared/lib/use-global-hotkeys";
import { useSidebar } from "@/shared/ui/shadcn/sidebar";

/** Shell chrome: Mod+K palette, Mod+B sidebar, ? shortcuts. */
export function SearchChrome({ children }: { children: ReactNode }) {
  const { toggleSidebar } = useSidebar();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  const searchUi = useMemo(
    () => ({
      openPalette: () => {
        setPaletteOpen(true);
      },
      togglePalette: () => {
        setPaletteOpen((open) => !open);
      },
      openShortcuts: () => {
        setShortcutsOpen(true);
      },
    }),
    []
  );

  const bindings = useMemo<HotkeyBinding[]>(
    () => [
      {
        id: "command-palette",
        key: "k",
        mod: true,
        allowInEditable: true,
        run: () => {
          setPaletteOpen((open) => !open);
        },
      },
      {
        id: "toggle-sidebar",
        key: "b",
        mod: true,
        allowInEditable: true,
        run: toggleSidebar,
      },
      {
        id: "shortcuts",
        key: "?",
        run: () => {
          setShortcutsOpen(true);
        },
      },
    ],
    [toggleSidebar]
  );

  useGlobalHotkeys(bindings);

  return (
    <SearchUiContext.Provider value={searchUi}>
      {children}
      <Suspense fallback={null}>
        <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </Suspense>
      <ShortcutsSheet open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </SearchUiContext.Provider>
  );
}
