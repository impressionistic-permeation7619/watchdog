import { describe, expect, it } from "vitest";
import { z } from "zod";

import { authFields, cliFields, databaseFields, s3Fields } from "../fragments";

describe("env fragments", () => {
  it("fails closed on a short auth secret", () => {
    const parsed = z.object(authFields).safeParse({
      BETTER_AUTH_SECRET: "too-short",
    });
    expect(parsed.success).toBe(false);
  });

  it("requires DATABASE_URL", () => {
    const parsed = z.object(databaseFields).safeParse({});
    expect(parsed.success).toBe(false);
  });

  it("defaults S3_REGION", () => {
    const parsed = z.object(s3Fields).parse({
      S3_ENDPOINT: "http://127.0.0.1:9100",
      S3_ACCESS_KEY: "minioadmin",
      S3_SECRET_KEY: "minioadmin",
      S3_BUCKET: "watchdog-evidence",
    });
    expect(parsed.S3_REGION).toBe("us-east-1");
  });

  it("requires WD_API_KEY", () => {
    const parsed = z.object(cliFields).safeParse({
      WD_API_URL: "http://localhost:3000/api/v1",
    });
    expect(parsed.success).toBe(false);
  });
});
