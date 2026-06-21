import "dotenv/config";
import { Client, Collection, GatewayIntentBits } from "discord.js";
import { BotClient } from "./types";
import { loadCommands } from "./handlers/commands";
import { loadEvents } from "./handlers/events";
import { loadPrefixCommands } from "./handlers/prefixCommands";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
}) as BotClient;
client.commands = new Collection();
client.prefixCommands = new Collection();

(async () => {
  await loadCommands(client);
  await loadPrefixCommands(client);
  await loadEvents(client);
  await client.login(process.env.TOKEN);
})();
