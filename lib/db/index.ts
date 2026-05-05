import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Local dev:  DATABASE_URL=file:./sports.db
// Production: DATABASE_URL=libsql://your-db.turso.io  +  DATABASE_AUTH_TOKEN=...
//
// The libsql client handles both transparently — no code change needed when
// switching from the local SQLite file to a Turso cloud database.

const client = createClient({
  url:       process.env.DATABASE_URL ?? "file:./sports.db",
  authToken: process.env.DATABASE_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
export * from "./schema";
