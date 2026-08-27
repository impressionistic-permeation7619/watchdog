import { createElement, useRef, useState, type MutableRefObject } from "react";

const LIVE_REGION_CLEAR_MS = 1500;

function announceLiveRegion(
  text: string,
  setMessage: (message: string) => void,
  clearRef: MutableRefObject<number | null>
): void {
  setMessage("");
  window.requestAnimationFrame(() => {
    setMessage(text);
    if (clearRef.current) window.clearTimeout(clearRef.current);
    clearRef.current = window.setTimeout(() => {
      setMessage("");
    }, LIVE_REGION_CLEAR_MS);
  });
}

export function useLiveRegion() {
  const [message, setMessage] = useState("");
  const clearRef = useRef<number | null>(null);

  const announce = (text: string) =>
    announceLiveRegion(text, setMessage, clearRef);

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
