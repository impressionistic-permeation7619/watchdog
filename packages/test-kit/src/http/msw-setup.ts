import { afterAll, afterEach, beforeAll } from "vitest";

import { mockServer } from "./mock-server.ts";

beforeAll(() => {
  mockServer.listen({ onUnhandledRequest: "bypass" });
});

afterEach(() => {
  mockServer.resetHandlers();
});

afterAll(() => {
  mockServer.close();
});
