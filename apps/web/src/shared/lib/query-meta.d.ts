import "@tanstack/react-query";

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: {
      /** Skip global QueryCache.onError toast for this query. */
      silentError?: boolean;
    };
  }
}
