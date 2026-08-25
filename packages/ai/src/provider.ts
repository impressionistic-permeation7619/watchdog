import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

import type { LlmProviderConfig } from "./llm-provider";

/** Resolve a LanguageModel from vault-shaped config (no Graph/DB). */
export function createWatchdogModel(config: LlmProviderConfig): LanguageModel {
  switch (config.kind) {
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey: config.apiKey });
      return anthropic(config.model);
    }
    case "openai_compat": {
      const openai = createOpenAICompatible({
        name: "watchdog-compat",
        apiKey: config.apiKey,
        baseURL: config.baseUrl,
      });
      return openai(config.model);
    }
    default: {
      const _exhaustive: never = config;
      return _exhaustive;
    }
  }
}
