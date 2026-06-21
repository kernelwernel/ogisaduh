import { readdirSync } from "fs";
import { join } from "path";
import { BotClient, Command } from "../types";

export async function loadCommands(client: BotClient) {
  const commandsPath = join(__dirname, "..", "commands");
  const commandFiles = readdirSync(commandsPath).filter((f) => f.endsWith(".js") || f.endsWith(".ts"));
  for (const file of commandFiles) {
    const command: Command = require(join(commandsPath, file));
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    }
  }
}
