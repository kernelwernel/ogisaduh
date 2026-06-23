import "dotenv/config";

const _stderr = process.stderr.write.bind(process.stderr);
(process.stderr as any).write = (chunk: any, ...args: any[]) => {
  if (typeof chunk === "string" && chunk.includes("Fontconfig")) return true;
  return _stderr(chunk, ...args);
};
import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import { BotClient } from "./types";
import { loadEvents } from "./handlers/events";
import { loadCommands } from "./handlers/commands";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.DirectMessages],
  partials: [Partials.Channel],
}) as BotClient;
client.prefixCommands = new Collection();

(async () => {
  await loadCommands(client);
  await loadEvents(client);
  await client.login(process.env.TOKEN);

  client.on("error", err => console.error("[ws] error:", err));
  client.on("warn", msg => console.warn("[ws] warn:", msg));

  // watchdog: if the WebSocket ping goes dead, exit so run.sh restarts
  setInterval(() => {
    const ping = client.ws.ping;
    if (ping === -1) {
      console.error("[watchdog] WebSocket ping is -1, connection is dead — restarting");
      process.exit(1);
    }
  }, 60_000);
})();
