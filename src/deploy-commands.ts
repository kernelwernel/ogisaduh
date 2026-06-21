import "dotenv/config";
import { REST, Routes } from "discord.js";
import { readdirSync } from "fs";
import { join } from "path";
import { Command } from "./types";

const commands: unknown[] = [];
const commandsPath = join(__dirname, "commands");
const commandFiles = readdirSync(commandsPath).filter((f) => f.endsWith(".js") || f.endsWith(".ts"));

for (const file of commandFiles) {
  const command: Command = require(join(commandsPath, file));
  if ("data" in command) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST().setToken(process.env.TOKEN!);

(async () => {
  const clientId = process.env.CLIENT_ID!;
  const guildId = process.env.GUILD_ID;
  const route = guildId
    ? Routes.applicationGuildCommands(clientId, guildId)
    : Routes.applicationCommands(clientId);
  const data = await rest.put(route, { body: commands }) as unknown[];
  console.log(`Registered ${data.length} command(s).`);
})();
