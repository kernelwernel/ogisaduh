import { Pool, types } from "pg";

// node-postgres returns BIGINT (OID 20) columns as strings to avoid silent precision
// loss on values past Number.MAX_SAFE_INTEGER. Our balances/timestamps never get
// anywhere near that, so parse them back into plain numbers everywhere.
types.setTypeParser(20, (val) => parseInt(val, 10));

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.warn("[db] DATABASE_URL is not set — economy commands will fail until it's configured.");
}

// CockroachDB (and most managed Postgres) requires TLS. `rejectUnauthorized: false`
// keeps the connection encrypted without needing a downloaded CA bundle.
export const pool = new Pool({
  connectionString,
  ssl: connectionString && !/sslmode=disable/.test(connectionString) ? { rejectUnauthorized: false } : undefined,
  // Without these, a dropped/stalled connection (common on hosted free-tier DBs) leaves
  // in-flight queries hanging forever instead of erroring — e.g. freezing mid-blackjack-round.
  connectionTimeoutMillis: 10_000,
  query_timeout: 10_000,
  statement_timeout: 10_000,
  idleTimeoutMillis: 30_000,
});

pool.on("error", (err) => {
  console.error("[db] idle client error", err);
});

let schemaReady: Promise<void> | null = null;

/** Creates the accounts table if it doesn't exist yet. Safe to call repeatedly — only runs once. */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = pool
      .query(`
        CREATE TABLE IF NOT EXISTS accounts (
          user_id TEXT PRIMARY KEY,
          cash BIGINT NOT NULL DEFAULT 500,
          bank BIGINT NOT NULL DEFAULT 0,
          last_daily BIGINT NOT NULL DEFAULT 0,
          last_work BIGINT NOT NULL DEFAULT 0,
          last_rob BIGINT NOT NULL DEFAULT 0,
          last_crime BIGINT NOT NULL DEFAULT 0
        )
      `)
      .then(() => undefined)
      .catch((err) => {
        schemaReady = null; // allow retrying on next call
        throw err;
      });
  }
  return schemaReady;
}
