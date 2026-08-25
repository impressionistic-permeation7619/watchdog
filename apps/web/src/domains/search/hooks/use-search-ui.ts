import { createContext, useContext } from "react";

export interface SearchUiValue {
  openPalette: () => void;
  togglePalette: () => void;
  openShortcuts: () => void;
}

const SearchUiContext = createContext<SearchUiValue | null>(null);

export function useSearchUi(): SearchUiValue {
  const value = useContext(SearchUiContext);
  if (!value) {
    throw new Error("useSearchUi must be used within SearchChrome");
  }
  return value;
}

export { SearchUiContext };
