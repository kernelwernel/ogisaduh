import "dotenv/config";
import { readFileSync } from "fs";

function getSecret(name: string, envFallback?: string): string {
  try {
    return readFileSync(`/run/secrets/${name}`, "utf8").trim();
  } catch {
    const val = envFallback ? process.env[envFallback] : undefined;
    if (!val) throw new Error(`Secret "${name}" not found: no secrets file and env var "${envFallback}" is unset`);
    return val;
  }
}

function getToken(): string {
  return getSecret("discord_token", "TOKEN");
}

process.on("unhandledRejection", (reason) => {
  console.error("[unhandledRejection]", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
});

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
  await client.login(getToken());

  client.on("error", err => console.error("[ws] error:", err));
  client.on("warn", msg => console.warn("[ws] warn:", msg));

  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  client.on("shardDisconnect", (event, shardId) => {
    console.warn(`[ws] shard ${shardId} disconnected (code ${event.code}) — waiting 2m for reconnect`);
    reconnectTimer = setTimeout(() => {
      console.error("[ws] failed to reconnect within 2m — restarting");
      process.exit(1);
    }, 120_000);
  });

  client.on("shardResume", () => {
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    console.log("[ws] shard resumed");
  });
})();
