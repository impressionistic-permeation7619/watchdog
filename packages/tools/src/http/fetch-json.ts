import {
  httpToolsError,
  parseToolsError,
  rateLimitedToolsError,
} from "../errors/tools-error";
import { isRecord } from "../parse/coerce";

export interface FetchJsonObjectInput {
  url: string | URL;
  init?: RequestInit;
  signal: AbortSignal;
  service: string;
  subject: string;
  /** Default: HTTP 2xx. Override when a vendor treats other statuses as success. */
  acceptStatus?: (status: number) => boolean;
}

export async function fetchJsonObject(
  input: FetchJsonObjectInput
): Promise<Record<string, unknown>> {
  const { url, init, signal, service, subject } = input;
  const acceptStatus =
    input.acceptStatus ?? ((status: number) => status >= 200 && status < 300);

  const res = await fetch(url, { ...init, signal });

  if (res.status === 429) {
    throw rateLimitedToolsError(service, subject);
  }
  if (!acceptStatus(res.status)) {
    throw httpToolsError(
      `${service} API`,
      res.status,
      `${service} API ${res.status} for ${subject}`
    );
  }

  const body: unknown = await res.json();
  if (!isRecord(body)) {
    throw parseToolsError(service, subject);
  }
  return body;
}
