/**
 * Centralized staleTime / gcTime tiers for TanStack Query.
 *
 * Rule: gcTime ≥ staleTime for each tier, or the cache evicts before data goes stale.
 *
 *   REALTIME → jobs, proposals (SSE-backed)
 *   DEFAULT  → entities, evidence, case context
 *   STABLE   → capabilities, credentials metadata
 */

/** 10 s — SSE-backed live lists. */
export const STALE_REALTIME = 10_000;

/** 30 s — general case-scoped data (global QueryClient default). */
export const STALE_DEFAULT = 30_000;

/** 5 min — stable catalogs. */
export const STALE_STABLE = 300_000;

/** 2 min — fast-changing data. */
export const GC_REALTIME = 2 * 60_000;

/** 5 min — general data. */
export const GC_DEFAULT = 5 * 60_000;

/** 30 min — keep warm across navigations. */
export const GC_STABLE = 30 * 60_000;
