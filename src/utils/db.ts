import { Pool, types } from "pg";
import { getSecret } from "./secrets";

// node-postgres returns BIGINT (OID 20) columns as strings by default to avoid silent
// precision loss on values past Number.MAX_SAFE_INTEGER — keep them as strings so callers
// can BigInt() them exactly instead of losing precision through a JS `number`.
types.setTypeParser(20, (val) => val);
// NUMERIC (OID 1700) columns default to being parsed with parseFloat, which is exactly the
// same precision-loss trap. cash/bank are NUMERIC (arbitrary precision, no ceiling), so this
// matters even more for them — keep as a raw string too.
types.setTypeParser(1700, (val) => val);

let connectionString: string | undefined;
try {
  connectionString = getSecret("database_url", "DATABASE_URL");
} catch {
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

// Schema-change DDL (ADD/ALTER/DROP COLUMN, etc.) runs as an async job on CockroachDB and
// can genuinely take longer than a normal query — the main `pool`'s 10s query_timeout exists
// specifically to keep *runtime* queries from hanging (e.g. mid-blackjack-round), and is too
// aggressive for one-time schema setup. Run migrations through a separate, unbounded-timeout
// connection instead, torn down once setup finishes.
function createSchemaPool(): Pool {
  return new Pool({
    connectionString,
    ssl: connectionString && !/sslmode=disable/.test(connectionString) ? { rejectUnauthorized: false } : undefined,
    max: 1,
  });
}

/**
 * Converts an existing BIGINT column to NUMERIC (arbitrary precision, no overflow ceiling).
 * A plain `ALTER COLUMN ... TYPE` needs an experimental flag on CockroachDB for this
 * conversion, so instead: add a NUMERIC shadow column, backfill it, then swap it in —
 * portable on both real Postgres and CockroachDB, and safe to call every startup (it
 * checks the column's actual type first and no-ops once already migrated).
 */
async function migrateColumnToNumeric(schemaPool: Pool, column: string, defaultValue: number): Promise<void> {
  const { rows } = await schemaPool.query(
    `SELECT data_type FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = $1`,
    [column]
  );
  if (rows[0]?.data_type === "numeric") return;

  const tempColumn = `${column}_numeric_migration`;
  await schemaPool.query(`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS ${tempColumn} NUMERIC`);
  await schemaPool.query(`UPDATE accounts SET ${tempColumn} = ${column}::NUMERIC WHERE ${tempColumn} IS NULL`);
  await schemaPool.query(`ALTER TABLE accounts ALTER COLUMN ${tempColumn} SET DEFAULT ${defaultValue}`);
  await schemaPool.query(`ALTER TABLE accounts ALTER COLUMN ${tempColumn} SET NOT NULL`);
  await schemaPool.query(`ALTER TABLE accounts DROP COLUMN ${column}`);
  await schemaPool.query(`ALTER TABLE accounts RENAME COLUMN ${tempColumn} TO ${column}`);
}

/** Creates the accounts table if it doesn't exist yet. Safe to call repeatedly — only runs once. */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const schemaPool = createSchemaPool();
      try {
        await schemaPool.query(`
          CREATE TABLE IF NOT EXISTS accounts (
            user_id TEXT PRIMARY KEY,
            cash NUMERIC NOT NULL DEFAULT 500,
            bank NUMERIC NOT NULL DEFAULT 0,
            last_daily BIGINT NOT NULL DEFAULT 0,
            last_work BIGINT NOT NULL DEFAULT 0,
            last_rob BIGINT NOT NULL DEFAULT 0,
            last_crime BIGINT NOT NULL DEFAULT 0
          )
        `);
        // CREATE TABLE IF NOT EXISTS won't add columns to a table that already existed before
        // they were introduced, so new columns need an explicit ALTER TABLE too.
        await schemaPool.query(`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS last_rob BIGINT NOT NULL DEFAULT 0`);
        await schemaPool.query(`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS last_crime BIGINT NOT NULL DEFAULT 0`);
        await schemaPool.query(`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS slot_streak BIGINT NOT NULL DEFAULT 0`);
        await schemaPool.query(`
          CREATE TABLE IF NOT EXISTS bans (
            user_id TEXT PRIMARY KEY,
            expires_at BIGINT NOT NULL
          )
        `);
        await migrateColumnToNumeric(schemaPool, "cash", 500);
        await migrateColumnToNumeric(schemaPool, "bank", 0);
      } finally {
        await schemaPool.end();
      }
    })().catch((err) => {
      schemaReady = null; // allow retrying on next call
      throw err;
    });
  }
  return schemaReady;
}
