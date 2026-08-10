import { readFileSync, existsSync } from "fs";
import { join } from "path";

const FILE = join(__dirname, "..", "..", "data", "prepend_prompt.txt");

/** Reads data/prepend_prompt.txt fresh on every call, so edits apply without a rebuild/restart. */
export function getPrependMessage(): string {
  if (!existsSync(FILE)) return "";
  try {
    return readFileSync(FILE, "utf8").trim();
  } catch {
    return "";
  }
}
