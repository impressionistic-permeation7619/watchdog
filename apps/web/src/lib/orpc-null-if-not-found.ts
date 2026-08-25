import { ORPCError, safe } from "@orpc/server";

/** Map oRPC NOT_FOUND → null for optional ServerFn lookups. */
export async function orpcNullIfNotFound<T>(
  promise: Promise<T>
): Promise<T | null> {
  const [error, data] = await safe(promise);
  if (!error) return data;
  if (error instanceof ORPCError && error.code === "NOT_FOUND") {
    return null;
  }
  throw error;
}
