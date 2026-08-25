import { createElement, useCallback, useRef, useState } from "react";

export function useLiveRegion() {
  const [message, setMessage] = useState("");
  const clearRef = useRef<number | null>(null);

  const announce = useCallback((text: string) => {
    setMessage("");
    window.requestAnimationFrame(() => {
      setMessage(text);
      if (clearRef.current) window.clearTimeout(clearRef.current);
      clearRef.current = window.setTimeout(() => {
        setMessage("");
      }, 1500);
    });
  }, []);

  const liveRegion = createElement(
    "div",
    {
      "aria-atomic": "true",
      "aria-live": "polite",
      className: "sr-only",
    },
    message
  );

  return { announce, liveRegion };
}
