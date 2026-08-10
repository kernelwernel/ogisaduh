import { pool, ensureSchema } from "./db";

export { ensureSchema };

export interface Account {
  cash: number;
  bank: number;
  lastDaily: number;
  lastWork: number;
  lastRob: number;
  lastCrime: number;
}

export const STARTING_CASH = 500;

const COOLDOWN_COLUMNS = {
  lastDaily: "last_daily",
  lastWork: "last_work",
  lastRob: "last_rob",
  lastCrime: "last_crime",
} as const;

function rowToAccount(row: any): Account {
  return {
    cash: Number(row.cash),
    bank: Number(row.bank),
    lastDaily: Number(row.last_daily),
    lastWork: Number(row.last_work),
    lastRob: Number(row.last_rob),
    lastCrime: Number(row.last_crime),
  };
}

/** Fetches a user's account, creating it (with the starting balance) if it doesn't exist yet. */
export async function getAccount(userId: string): Promise<Account> {
  await ensureSchema();
  const res = await pool.query(
    `INSERT INTO accounts (user_id, cash) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET user_id = accounts.user_id
     RETURNING *`,
    [userId, STARTING_CASH]
  );
  return rowToAccount(res.rows[0]);
}

// No floor here: adding a positive amount can never push a balance below what it already was,
// and if the balance is currently negative (debt from a fine/rob), earnings should pay that
// debt down properly instead of jumping straight back to 0.
export async function addCash(userId: string, amount: number): Promise<Account> {
  await getAccount(userId);
  const res = await pool.query(
    `UPDATE accounts SET cash = cash + $2 WHERE user_id = $1 RETURNING *`,
    [userId, Math.floor(amount)]
  );
  return rowToAccount(res.rows[0]);
}

/** Deducts cash. By default the balance floors at 0; pass `allowNegative` to let it dip below. */
export async function removeCash(userId: string, amount: number, opts: { allowNegative?: boolean } = {}): Promise<Account> {
  await getAccount(userId);
  const res = await pool.query(
    opts.allowNegative
      ? `UPDATE accounts SET cash = cash - $2 WHERE user_id = $1 RETURNING *`
      : `UPDATE accounts SET cash = GREATEST(cash - $2, 0) WHERE user_id = $1 RETURNING *`,
    [userId, Math.floor(amount)]
  );
  return rowToAccount(res.rows[0]);
}

export async function deposit(userId: string, amount: number): Promise<{ ok: boolean; account: Account }> {
  await getAccount(userId);
  const res = await pool.query(
    `UPDATE accounts SET cash = cash - $2, bank = bank + $2 WHERE user_id = $1 AND cash >= $2 RETURNING *`,
    [userId, Math.floor(amount)]
  );
  if (res.rowCount === 0) {
    return { ok: false, account: await getAccount(userId) };
  }
  return { ok: true, account: rowToAccount(res.rows[0]) };
}

export async function withdraw(userId: string, amount: number): Promise<{ ok: boolean; account: Account }> {
  await getAccount(userId);
  const res = await pool.query(
    `UPDATE accounts SET bank = bank - $2, cash = cash + $2 WHERE user_id = $1 AND bank >= $2 RETURNING *`,
    [userId, Math.floor(amount)]
  );
  if (res.rowCount === 0) {
    return { ok: false, account: await getAccount(userId) };
  }
  return { ok: true, account: rowToAccount(res.rows[0]) };
}

/** Sets a balance to an exact value. By default it floors at 0; pass `allowNegative` to let it dip below. */
export async function setBalance(
  userId: string,
  field: "cash" | "bank",
  amount: number,
  opts: { allowNegative?: boolean } = {}
): Promise<Account> {
  await getAccount(userId);
  const column = field === "bank" ? "bank" : "cash";
  const res = await pool.query(
    opts.allowNegative
      ? `UPDATE accounts SET ${column} = $2 WHERE user_id = $1 RETURNING *`
      : `UPDATE accounts SET ${column} = GREATEST($2, 0) WHERE user_id = $1 RETURNING *`,
    [userId, Math.floor(amount)]
  );
  return rowToAccount(res.rows[0]);
}

/** Moves cash from one user to another atomically. Returns false if the sender can't cover it. */
export async function transfer(fromId: string, toId: string, amount: number): Promise<boolean> {
  await getAccount(fromId);
  await getAccount(toId);
  const amt = Math.floor(amount);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const res = await client.query(
      `UPDATE accounts SET cash = cash - $2 WHERE user_id = $1 AND cash >= $2`,
      [fromId, amt]
    );
    if (res.rowCount === 0) {
      await client.query("ROLLBACK");
      return false;
    }
    await client.query(`UPDATE accounts SET cash = cash + $2 WHERE user_id = $1`, [toId, amt]);
    await client.query("COMMIT");
    return true;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function touchCooldown(userId: string, field: keyof typeof COOLDOWN_COLUMNS, value = Date.now()): Promise<void> {
  await getAccount(userId);
  const column = COOLDOWN_COLUMNS[field];
  await pool.query(`UPDATE accounts SET ${column} = $2 WHERE user_id = $1`, [userId, value]);
}

export const COOLDOWN_FIELDS = Object.keys(COOLDOWN_COLUMNS) as Array<keyof typeof COOLDOWN_COLUMNS>;

/** Clears one (or all) of a user's command cooldowns by zeroing the relevant timestamp column(s). */
export async function resetCooldowns(userId: string, fields: Array<keyof typeof COOLDOWN_COLUMNS> = COOLDOWN_FIELDS): Promise<void> {
  await getAccount(userId);
  for (const field of fields) {
    await touchCooldown(userId, field, 0);
  }
}

/** Clears one (or all) command cooldowns for every account at once. */
export async function resetCooldownsForAll(fields: Array<keyof typeof COOLDOWN_COLUMNS> = COOLDOWN_FIELDS): Promise<void> {
  await ensureSchema();
  for (const field of fields) {
    const column = COOLDOWN_COLUMNS[field];
    await pool.query(`UPDATE accounts SET ${column} = 0`);
  }
}

export function netWorth(acc: Account): number {
  return acc.cash + acc.bank;
}

export async function getLeaderboard(limit = 10): Promise<Array<{ userId: string; account: Account }>> {
  await ensureSchema();
  const res = await pool.query(`SELECT * FROM accounts ORDER BY (cash + bank) DESC LIMIT $1`, [limit]);
  return res.rows.map((row) => ({ userId: row.user_id, account: rowToAccount(row) }));
}

export function formatCurrency(amount: number): string {
  return `$${Math.floor(amount).toLocaleString("en-US")}`;
}

/** Parses a bet/amount argument, supporting "all"/"half" relative to `available`. */
export function parseAmount(arg: string | undefined, available: number): number | null {
  if (!arg) return null;
  const lower = arg.toLowerCase();
  if (lower === "all" || lower === "max") return available > 0 ? available : null;
  if (lower === "half") return available > 1 ? Math.floor(available / 2) : null;
  const n = Math.floor(Number(arg.replace(/,/g, "")));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

/** Returns remaining cooldown ms, or 0 if ready. */
export function cooldownRemaining(last: number, cooldownMs: number): number {
  return Math.max(0, (last || 0) + cooldownMs - Date.now());
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const parts: string[] = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s || parts.length === 0) parts.push(`${s}s`);
  return parts.join(" ");
}
