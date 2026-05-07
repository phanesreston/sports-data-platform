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

// Ensure fixture_predictions exists — safe on every cold start without requiring
// a manual db:push after pulling new code.
client.execute(`
  CREATE TABLE IF NOT EXISTS fixture_predictions (
    fixture_id INTEGER PRIMARY KEY REFERENCES fixtures(id),
    home_pct   INTEGER NOT NULL,
    draw_pct   INTEGER NOT NULL,
    away_pct   INTEGER NOT NULL,
    advice     TEXT,
    under_over TEXT,
    updated_at INTEGER NOT NULL
  )
`).catch((err) => console.error("[db] fixture_predictions migration failed:", err));

export const db = drizzle(client, { schema });
export * from "./schema";
