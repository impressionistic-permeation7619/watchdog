import { generateText, Output, type LanguageModel } from "ai";
import type { z } from "zod";

export interface StructuredExtractUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface StructuredExtractResult<T> {
  object: T;
  usage?: StructuredExtractUsage;
}

/**
 * Thin wrapper: generateText + Output.object.
 * Caps call this — do not import `ai` directly in Cap bodies beyond this package.
 */
export async function structuredExtract<TSchema extends z.ZodType>(input: {
  model: LanguageModel;
  schema: TSchema;
  instructions?: string;
  prompt: string;
  abortSignal?: AbortSignal;
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<StructuredExtractResult<z.infer<TSchema>>> {
  const result = await generateText({
    model: input.model,
    instructions: input.instructions,
    prompt: input.prompt,
    abortSignal: input.abortSignal,
    temperature: input.temperature ?? 0,
    maxOutputTokens: input.maxOutputTokens,
    output: Output.object({ schema: input.schema }),
  });

  if (result.output === null || result.output === undefined) {
    throw new Error("structuredExtract: model returned no output object");
  }

  const usage = {
    inputTokens: result.usage.inputTokens,
    outputTokens: result.usage.outputTokens,
    totalTokens: result.usage.totalTokens,
  };

  return { object: input.schema.parse(result.output), usage };
}
