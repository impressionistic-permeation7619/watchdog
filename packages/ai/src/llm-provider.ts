import { z } from "zod";

/** Vault-shaped provider config — never env soup in Cap bodies. */
export const llmProviderConfigSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("anthropic"),
    apiKey: z.string().min(1),
    model: z.string().min(1),
  }),
  z.object({
    kind: z.literal("openai_compat"),
    baseUrl: z.url(),
    apiKey: z.string().min(1),
    model: z.string().min(1),
  }),
]);

export type LlmProviderConfig = z.infer<typeof llmProviderConfigSchema>;
