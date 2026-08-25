import { useSyncExternalStore } from "react";

function subscribe() {
  // Hydration never changes back — no updates to subscribe to.
  return () => {
    /* empty */
  };
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

/** Returns `true` once the component has mounted on the client. */
export function useHydrated() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
