import "@tanstack/react-start/server-only";
import { CORSPlugin } from "@orpc/server/plugins";

/** Shared CORS policy for OpenAPI, RPC, and SSE routes. */
export const watchdogCorsPlugin = new CORSPlugin();

export function applyWatchdogCors(
  request: Request,
  response: Response
): Response {
  const origin = request.headers.get("Origin");
  if (!origin) return response;

  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", origin);
  const vary = headers.get("Vary");
  if (!vary?.split(",").some((v) => v.trim().toLowerCase() === "origin")) {
    headers.set("Vary", vary ? `${vary}, Origin` : "Origin");
  }
  headers.set("Access-Control-Allow-Credentials", "true");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function corsPreflightResponse(request: Request): Response | null {
  if (request.method !== "OPTIONS") return null;
  const origin = request.headers.get("Origin");
  if (!origin) return new Response(null, { status: 204 });

  const headers = new Headers({
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods":
      "GET, HEAD, PUT, POST, DELETE, PATCH, OPTIONS",
  });
  const requestHeaders = request.headers.get("Access-Control-Request-Headers");
  if (requestHeaders) {
    headers.set("Access-Control-Allow-Headers", requestHeaders);
  }
  return new Response(null, { status: 204, headers });
}
