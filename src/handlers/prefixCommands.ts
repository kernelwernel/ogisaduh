import { readdirSync } from "fs";
import { join } from "path";
import { BotClient, PrefixCommand } from "../types";

export async function loadPrefixCommands(client: BotClient) {
  const dir = join(__dirname, "..", "prefixCommands");
  const files = readdirSync(dir).filter((f) => f.endsWith(".js") || f.endsWith(".ts"));
  for (const file of files) {
    const cmd: PrefixCommand = require(join(dir, file));
    client.prefixCommands.set(cmd.name, cmd);
    console.log(`Loaded prefix command: ${cmd.name}`);
  }
}
