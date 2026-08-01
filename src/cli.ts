import { Client } from "discord.js";
import { createInterface } from "readline";

export const MAIN_CHANNEL_ID = "1337901418664824903";

export async function startCli(client: Client) {
  const channel = await client.channels.fetch(MAIN_CHANNEL_ID);
  if (!channel?.isTextBased() || !("send" in channel)) {
    console.error("[cli] main channel is not text-sendable — CLI disabled");
    return;
  }

  const rl = createInterface({ input: process.stdin, terminal: false });
  console.log("[cli] ready — messages typed here are sent to the main channel");

  rl.on("line", async (line) => {
    const text = line.trim();
    if (!text) return;

    try {
      await channel.send(text);
    } catch (err) {
      console.error("[cli] failed to send:", err);
    }
  });
}
