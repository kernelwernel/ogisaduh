import { pool, ensureSchema } from "./db";

export { ensureSchema };

export interface Account {
  cash: bigint;
  bank: bigint;
  lastDaily: number;
  lastWork: number;
  lastRob: number;
  lastCrime: number;
  /** Consecutive slots wins — each one adds 1% to the next spin's win chance, reset by a loss. */
  slotStreak: number;
}

export const STARTING_CASH = 500n;

const COOLDOWN_COLUMNS = {
  lastDaily: "last_daily",
  lastWork: "last_work",
  lastRob: "last_rob",
  lastCrime: "last_crime",
} as const;

function rowToAccount(row: any): Account {
  return {
    cash: BigInt(row.cash),
    bank: BigInt(row.bank),
    lastDaily: Number(row.last_daily),
    lastWork: Number(row.last_work),
    lastRob: Number(row.last_rob),
    lastCrime: Number(row.last_crime),
    slotStreak: Number(row.slot_streak),
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
export async function addCash(userId: string, amount: bigint): Promise<Account> {
  await getAccount(userId);
  const res = await pool.query(
    `UPDATE accounts SET cash = cash + $2 WHERE user_id = $1 RETURNING *`,
    [userId, amount]
  );
  return rowToAccount(res.rows[0]);
}

/** Deducts cash. By default the balance floors at 0; pass `allowNegative` to let it dip below. */
export async function removeCash(userId: string, amount: bigint, opts: { allowNegative?: boolean } = {}): Promise<Account> {
  await getAccount(userId);
  const res = await pool.query(
    opts.allowNegative
      ? `UPDATE accounts SET cash = cash - $2 WHERE user_id = $1 RETURNING *`
      : `UPDATE accounts SET cash = GREATEST(cash - $2, 0) WHERE user_id = $1 RETURNING *`,
    [userId, amount]
  );
  return rowToAccount(res.rows[0]);
}

export async function deposit(userId: string, amount: bigint): Promise<{ ok: boolean; account: Account }> {
  await getAccount(userId);
  const res = await pool.query(
    `UPDATE accounts SET cash = cash - $2, bank = bank + $2 WHERE user_id = $1 AND cash >= $2 RETURNING *`,
    [userId, amount]
  );
  if (res.rowCount === 0) {
    return { ok: false, account: await getAccount(userId) };
  }
  return { ok: true, account: rowToAccount(res.rows[0]) };
}

export async function withdraw(userId: string, amount: bigint): Promise<{ ok: boolean; account: Account }> {
  await getAccount(userId);
  const res = await pool.query(
    `UPDATE accounts SET bank = bank - $2, cash = cash + $2 WHERE user_id = $1 AND bank >= $2 RETURNING *`,
    [userId, amount]
  );
  if (res.rowCount === 0) {
    return { ok: false, account: await getAccount(userId) };
  }
  return { ok: true, account: rowToAccount(res.rows[0]) };
}

/** Clears cash debt by raising a negative balance to 0. Leaves a non-negative balance untouched. */
export async function clearDebt(userId: string): Promise<Account> {
  await getAccount(userId);
  const res = await pool.query(`UPDATE accounts SET cash = GREATEST(cash, 0) WHERE user_id = $1 RETURNING *`, [userId]);
  return rowToAccount(res.rows[0]);
}

/** Sets a balance to an exact value. By default it floors at 0; pass `allowNegative` to let it dip below. */
export async function setBalance(
  userId: string,
  field: "cash" | "bank",
  amount: bigint,
  opts: { allowNegative?: boolean } = {}
): Promise<Account> {
  await getAccount(userId);
  const column = field === "bank" ? "bank" : "cash";
  const res = await pool.query(
    opts.allowNegative
      ? `UPDATE accounts SET ${column} = $2 WHERE user_id = $1 RETURNING *`
      : `UPDATE accounts SET ${column} = GREATEST($2, 0) WHERE user_id = $1 RETURNING *`,
    [userId, amount]
  );
  return rowToAccount(res.rows[0]);
}

/** Moves cash from one user to another atomically. Returns false if the sender can't cover it. */
export async function transfer(fromId: string, toId: string, amount: bigint): Promise<boolean> {
  await getAccount(fromId);
  await getAccount(toId);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const res = await client.query(
      `UPDATE accounts SET cash = cash - $2 WHERE user_id = $1 AND cash >= $2`,
      [fromId, amount]
    );
    if (res.rowCount === 0) {
      await client.query("ROLLBACK");
      return false;
    }
    await client.query(`UPDATE accounts SET cash = cash + $2 WHERE user_id = $1`, [toId, amount]);
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

export async function setSlotStreak(userId: string, streak: number): Promise<void> {
  await getAccount(userId);
  await pool.query(`UPDATE accounts SET slot_streak = $2 WHERE user_id = $1`, [userId, Math.max(0, Math.floor(streak))]);
}

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

export function netWorth(acc: Account): bigint {
  return acc.cash + acc.bank;
}

/** Wipes every account — cash, bank, cooldowns, and slot streaks all reset to defaults. Irreversible. */
export async function resetEconomy(): Promise<void> {
  await ensureSchema();
  await pool.query(`TRUNCATE accounts`);
}

export async function getLeaderboard(limit = 10): Promise<Array<{ userId: string; account: Account }>> {
  await ensureSchema();
  const res = await pool.query(`SELECT * FROM accounts ORDER BY (cash + bank) DESC LIMIT $1`, [limit]);
  return res.rows.map((row) => ({ userId: row.user_id, account: rowToAccount(row) }));
}

export function formatCurrency(amount: bigint | number): string {
  const n = typeof amount === "bigint" ? amount : BigInt(Math.floor(amount));
  return `$${n.toLocaleString("en-US")}`;
}

/**
 * Multiplies a bigint amount by a plain float ratio (payout multipliers, steal percentages,
 * etc.) without ever mixing bigint and number in arithmetic. Scales the float to a fixed-point
 * integer at `precision` decimal digits, does the multiply in bigint, then scales back down —
 * truncates like Math.floor would for non-negative results.
 */
export function scaleBigInt(amount: bigint, ratio: number, precision = 6): bigint {
  const scale = 10 ** precision;
  const scaledRatio = BigInt(Math.round(ratio * scale));
  return (amount * scaledRatio) / BigInt(scale);
}

/** Parses a bet/amount argument, supporting "all"/"half" relative to `available`. */
export function parseAmount(arg: string | undefined, available: bigint): bigint | null {
  if (!arg) return null;
  const lower = arg.toLowerCase();
  if (lower === "all" || lower === "max") return available > 0n ? available : null;
  if (lower === "half") return available > 1n ? available / 2n : null;
  const cleaned = arg.replace(/,/g, "");
  if (!/^\d+$/.test(cleaned)) return null;
  const n = BigInt(cleaned);
  return n > 0n ? n : null;
}

/** Parses a plain positive whole-dollar amount (owner commands like $addmoney — no "all"/"half"). Returns null if invalid. */
export function parseWholeAmount(arg: string | undefined): bigint | null {
  if (!arg) return null;
  const cleaned = arg.replace(/,/g, "");
  if (!/^\d+$/.test(cleaned)) return null;
  const n = BigInt(cleaned);
  return n > 0n ? n : null;
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
