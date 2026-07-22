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

  // Zombied gateway connections don't always emit shardDisconnect/error — the socket can go
  // silent while looking alive, leaving the bot unresponsive with no crash to trigger a restart.
  // Track heartbeat ACKs directly and force-exit if they stop, so `restart: on-failure` can recover.
  let lastHeartbeatAck = Date.now();
  client.on("debug", (msg) => {
    if (msg.includes("Heartbeat acknowledged")) lastHeartbeatAck = Date.now();
  });
  const HEARTBEAT_TIMEOUT_MS = 3 * 60_000;
  const WATCHDOG_INTERVAL_MS = 60_000;
  // setInterval can't tick while the process itself is frozen (host suspend, event-loop
  // block, etc.), so a long freeze shows up as one huge gap between ticks instead of many
  // missed ones. Detect that directly rather than inferring it from a stale heartbeat —
  // by the time we wake up the gateway session is stale regardless of the last ACK.
  let lastTick = Date.now();
  setInterval(() => {
    const now = Date.now();
    const tickGap = now - lastTick;
    lastTick = now;
    if (tickGap > WATCHDOG_INTERVAL_MS * 3) {
      console.error(`[watchdog] process was frozen for ${Math.round(tickGap / 1000)}s (host sleep/suspend?) — restarting for a clean session`);
      process.exit(1);
    }

    const silence = now - lastHeartbeatAck;
    if (silence > HEARTBEAT_TIMEOUT_MS) {
      console.error(`[watchdog] no heartbeat ack in ${Math.round(silence / 1000)}s — connection likely zombied, restarting`);
      process.exit(1);
    }
  }, WATCHDOG_INTERVAL_MS).unref();

  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  // Suspending the host (e.g. closing a laptop lid) freezes the whole process, not just the
  // network. On wake, discord.js often tries to resume a session that's already stale, or the
  // network is still flapping as it reassociates — producing repeated disconnect/resume cycles
  // that never go fully silent (so the heartbeat watchdog above never trips) but never stabilize
  // either. Treat that flapping as unrecoverable and force a clean restart instead.
  let disconnectTimestamps: number[] = [];
  const FLAP_WINDOW_MS = 5 * 60_000;
  const FLAP_THRESHOLD = 3;

  client.on("shardDisconnect", (event, shardId) => {
    console.warn(`[ws] shard ${shardId} disconnected (code ${event.code}) — waiting 2m for reconnect`);

    const now = Date.now();
    disconnectTimestamps.push(now);
    disconnectTimestamps = disconnectTimestamps.filter(t => now - t < FLAP_WINDOW_MS);
    if (disconnectTimestamps.length >= FLAP_THRESHOLD) {
      console.error(`[ws] shard disconnected ${disconnectTimestamps.length} times in ${Math.round(FLAP_WINDOW_MS / 60_000)}m — connection is flapping (likely a stale session after sleep/wake), restarting`);
      process.exit(1);
    }

    if (reconnectTimer) clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
      console.error("[ws] failed to reconnect within 2m — restarting");
      process.exit(1);
    }, 120_000);
  });

  client.on("shardResume", () => {
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    console.log("[ws] shard resumed");
  });

  client.on("invalidated", () => {
    console.error("[ws] session invalidated and cannot be resumed — restarting");
    process.exit(1);
  });
})();
