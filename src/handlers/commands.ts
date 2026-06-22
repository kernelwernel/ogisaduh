import { readdirSync } from "fs";
import { join } from "path";
import { BotClient, PrefixCommand } from "../types";

export async function loadCommands(client: BotClient) {
  const dir = join(__dirname, "..", "commands");
  const files = readdirSync(dir).filter((f) => f.endsWith(".js") || f.endsWith(".ts"));
  for (const file of files) {
    const cmd: PrefixCommand = require(join(dir, file));
    client.prefixCommands.set(cmd.name, cmd);
    console.log(`Loaded command: ${cmd.name}`);
  }
}
