import { Client, Events, ActivityType } from "discord.js";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const STATUS_FILE = join(__dirname, "..", "..", "data", "status.json");

module.exports = {
  name: Events.ShardResume,
  once: false,
  async execute(_shardId: number, _replayedEvents: number, client: Client) {
    let text = process.env.BOT_ACTIVITY!;
    if (existsSync(STATUS_FILE)) {
      try { text = JSON.parse(readFileSync(STATUS_FILE, "utf-8")).text; } catch {}
    }
    client.user?.setPresence({
      status: "online",
      activities: [{ name: text, state: text, type: ActivityType.Custom }],
    });
    console.log("[shard] resumed — presence restored");
  },
};
