/**
 * One-off migration: imports data/economy.json (the old file-based economy store)
 * into the DATABASE_URL Postgres/CockroachDB database.
 *
 * Usage: npx ts-node src/scripts/migrateEconomy.ts
 */
import "dotenv/config";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { pool, ensureSchema } from "../utils/db";

interface OldAccount {
  cash: number;
  bank: number;
  lastDaily: number;
  lastWork: number;
  lastRob: number;
  lastCrime?: number;
}

async function main() {
  const file = join(__dirname, "..", "..", "data", "economy.json");
  if (!existsSync(file)) {
    console.log(`No file at ${file} — nothing to migrate.`);
    return;
  }

  const data: Record<string, OldAccount> = JSON.parse(readFileSync(file, "utf8"));
  const entries = Object.entries(data);
  console.log(`Migrating ${entries.length} account(s) into the database...`);

  await ensureSchema();

  for (const [userId, acc] of entries) {
    await pool.query(
      `INSERT INTO accounts (user_id, cash, bank, last_daily, last_work, last_rob, last_crime)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO UPDATE SET
         cash = EXCLUDED.cash,
         bank = EXCLUDED.bank,
         last_daily = EXCLUDED.last_daily,
         last_work = EXCLUDED.last_work,
         last_rob = EXCLUDED.last_rob,
         last_crime = EXCLUDED.last_crime`,
      [userId, Math.floor(acc.cash) || 0, Math.floor(acc.bank) || 0, acc.lastDaily || 0, acc.lastWork || 0, acc.lastRob || 0, acc.lastCrime || 0]
    );
  }

  console.log("Done.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
