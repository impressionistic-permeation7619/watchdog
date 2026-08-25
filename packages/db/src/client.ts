import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@watchdog/env/server";

import * as schema from "./schema/index";

const connectionString = env.DATABASE_URL;

/**
 * Vite / tsx watch re-evaluate this module on HMR. Without a process-global
 * singleton each reload opens another pool (max: 10) and never ends the old
 * one → Postgres 53300. Keep one client per process.
 */
const globalForDb = globalThis as typeof globalThis & {
  __watchdogPg?: ReturnType<typeof postgres>;
  __watchdogDb?: ReturnType<typeof drizzle<typeof schema>>;
};

export const client =
  globalForDb.__watchdogPg ??
  postgres(connectionString, {
    max: 10,
    // Close unused sockets so a rare leak cannot pin max_connections forever.
    idle_timeout: 20,
    max_lifetime: 60 * 30,
  });

export const db = globalForDb.__watchdogDb ?? drizzle(client, { schema });

globalForDb.__watchdogPg = client;
globalForDb.__watchdogDb = db;

export type Db = typeof db;
