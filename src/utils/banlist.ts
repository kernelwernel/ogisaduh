import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const FILE = join(__dirname, "..", "..", "data", "banlist.json");

function load(): string[] {
  if (!existsSync(FILE)) return [];
  try { return JSON.parse(readFileSync(FILE, "utf8")); } catch { return []; }
}

function save(ids: string[]) {
  writeFileSync(FILE, JSON.stringify(ids, null, 2), "utf8");
}

export function isBanned(userId: string): boolean {
  return load().includes(userId);
}

export function ban(userId: string): boolean {
  const ids = load();
  if (ids.includes(userId)) return false;
  ids.push(userId);
  save(ids);
  return true;
}

export function unban(userId: string): boolean {
  const ids = load();
  const next = ids.filter(id => id !== userId);
  if (next.length === ids.length) return false;
  save(next);
  return true;
}
