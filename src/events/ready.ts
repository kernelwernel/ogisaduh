import { Client, Events, ActivityType, EmbedBuilder, TextChannel } from "discord.js";
import { existsSync, readFileSync, unlinkSync } from "fs";
import { join } from "path";

const STATUS_FILE = join(__dirname, "..", "..", "data", "status.json");
const RESTART_FILE = join(__dirname, "..", "..", "data", "restart.json");

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client) {
    let text = process.env.BOT_ACTIVITY!;
    if (existsSync(STATUS_FILE)) {
      try { text = JSON.parse(readFileSync(STATUS_FILE, "utf-8")).text; } catch {}
    }
    client.user?.setPresence({
      status: "online",
      activities: [{ name: text, state: text, type: ActivityType.Custom }],
    });
    console.log(`Logged in as ${client.user?.tag}`);

    if (existsSync(RESTART_FILE)) {
      try {
        const { channelId } = JSON.parse(readFileSync(RESTART_FILE, "utf-8"));
        unlinkSync(RESTART_FILE);
        const channel = await client.channels.fetch(channelId) as TextChannel;
        await channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle("🛠 Restart")
              .setDescription("```> Restart successful```")
              .setColor(0x27e462),
          ],
        });
      } catch (err) {
        console.error("[restart] Failed to send confirmation:", err);
      }
    }
  },
};