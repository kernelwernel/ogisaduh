import { readdirSync, statSync } from "fs";
import { join, basename, dirname } from "path";
import { BotClient, PrefixCommand } from "../types";

function collectCommandFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...collectCommandFiles(full));
    } else if (entry.endsWith(".js") || entry.endsWith(".ts")) {
      files.push(full);
    }
  }
  return files;
}

export async function loadCommands(client: BotClient) {
  const dir = join(__dirname, "..", "commands");
  const files = collectCommandFiles(dir);
  for (const file of files) {
    const cmd: PrefixCommand = require(file);
    cmd.category = basename(dirname(file));
    client.prefixCommands.set(cmd.name, cmd);
    for (const alias of cmd.aliases ?? []) {
      client.prefixCommands.set(alias, cmd);
    }
    console.log(`Loaded command: ${cmd.name}${cmd.aliases?.length ? ` (aliases: ${cmd.aliases.join(", ")})` : ""}`);
  }
}
