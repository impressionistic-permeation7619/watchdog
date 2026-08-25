import { useEffect, useRef } from "react";

import { createHotkeyListener, type HotkeyBinding } from "@/shared/lib/hotkeys";

/** Single window keydown listener for the given bindings. */
export function useGlobalHotkeys(bindings: readonly HotkeyBinding[]): void {
  const bindingsRef = useRef(bindings);

  useEffect(() => {
    bindingsRef.current = bindings;
  }, [bindings]);

  useEffect(() => {
    const onKeyDown = createHotkeyListener(() => bindingsRef.current);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);
}
