import { readFileSync, existsSync } from "fs";
import { join } from "path";

const FILE = join(__dirname, "..", "..", "data", "server_context.txt");

/** Reads data/server_context.txt fresh on every call, so edits apply without a rebuild/restart. */
export function getServerContext(): string {
  if (!existsSync(FILE)) return "";
  try {
    return readFileSync(FILE, "utf8").trim();
  } catch {
    return "";
  }
}
