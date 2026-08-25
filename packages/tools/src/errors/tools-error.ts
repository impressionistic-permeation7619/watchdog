export class ToolsError extends Error {
  override readonly name = "ToolsError";
  readonly status: number | null;
  readonly code: string;

  constructor(
    message: string,
    options?: { status?: number | null; code?: string }
  ) {
    super(message);
    this.status = options?.status ?? null;
    this.code = options?.code ?? "tools_error";
  }
}

export function isToolsError(error: unknown): error is ToolsError {
  return error instanceof ToolsError;
}

export function httpToolsError(
  service: string,
  status: number,
  detail?: string
): ToolsError {
  return new ToolsError(detail ?? `${service} HTTP ${status}`, {
    status,
    code: "http_error",
  });
}

export function missingApiKey(name: string): ToolsError {
  return new ToolsError(`${name} required`, { code: "missing_api_key" });
}

export function rateLimitedToolsError(
  service: string,
  subject: string
): ToolsError {
  return new ToolsError(`${service} rate-limited for ${subject}`, {
    status: 429,
    code: "rate_limited",
  });
}

export function parseToolsError(
  service: string,
  subject: string,
  detail?: string
): ToolsError {
  return new ToolsError(
    detail ?? `${service} response for ${subject} was not a JSON object`,
    { code: "parse_error" }
  );
}

export function validationToolsError(message: string): ToolsError {
  return new ToolsError(message, { code: "validation_error" });
}

export function abortedToolsError(message: string): ToolsError {
  return new ToolsError(message, { code: "aborted" });
}
