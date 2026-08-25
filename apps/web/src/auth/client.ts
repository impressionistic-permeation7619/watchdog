import { apiKeyClient } from "@better-auth/api-key/client";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: typeof window === "undefined" ? undefined : window.location.origin,
  plugins: [apiKeyClient()],
});
