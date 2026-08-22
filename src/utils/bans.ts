import { pool, ensureSchema } from "./db";

// Bans are never permanent — every ban has an expiry, 24h by default.
export const DEFAULT_BAN_DURATION_MS = 24 * 60 * 60 * 1000;

// isBanned() is checked on every single message the bot sees, so it reads a synchronous
// in-memory cache (mirroring the `bans` table) rather than hitting the DB per message.
// The cache is populated once at startup and kept in sync by ban()/unban() themselves,
// since those are the only things that ever mutate it.
const cache = new Map<string, number>(); // userId -> expiresAt (ms)
let ready: Promise<void> | null = null;

/** Loads the ban list from the DB into memory. Call once at startup before relying on isBanned(). */
export function initBans(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await ensureSchema();
      const res = await pool.query(`SELECT user_id, expires_at FROM bans`);
      for (const row of res.rows) {
        cache.set(row.user_id, Number(row.expires_at));
      }
    })();
  }
  return ready;
}

export function isBanned(userId: string): boolean {
  const expiresAt = cache.get(userId);
  if (expiresAt === undefined) return false;
  if (expiresAt <= Date.now()) {
    cache.delete(userId);
    pool.query(`DELETE FROM bans WHERE user_id = $1`, [userId]).catch((err) => console.error("[bans] cleanup failed", err));
    return false;
  }
  return true;
}

/** Bans a user for `durationMs` (defaults to 24h). Returns false if they were already banned (their expiry is still updated). */
export async function ban(userId: string, durationMs: number = DEFAULT_BAN_DURATION_MS): Promise<boolean> {
  const alreadyBanned = isBanned(userId);
  const expiresAt = Date.now() + durationMs;
  await pool.query(
    `INSERT INTO bans (user_id, expires_at) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET expires_at = $2`,
    [userId, expiresAt]
  );
  cache.set(userId, expiresAt);
  return !alreadyBanned;
}

export async function unban(userId: string): Promise<boolean> {
  if (!cache.has(userId)) return false;
  cache.delete(userId);
  await pool.query(`DELETE FROM bans WHERE user_id = $1`, [userId]);
  return true;
}

/** Returns the ban's expiry timestamp (ms), or undefined if not currently banned. */
export function banExpiry(userId: string): number | undefined {
  return cache.get(userId);
}

const DURATION_UNITS: Record<string, number> = {
  s: 1000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
  w: 604_800_000,
};

/** Parses a duration like "30s", "10m", "2h", "7d", "1w". Returns null if the format is invalid. */
export function parseDuration(input: string): number | null {
  const match = /^(\d+)(s|m|h|d|w)$/i.exec(input.trim());
  if (!match) return null;
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  return value * DURATION_UNITS[unit];
}
