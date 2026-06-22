import { Message, ActivityType, TextChannel } from "discord.js";
import { PrefixCommand } from "../types";
import { writeFileSync } from "fs";
import { join } from "path";

const STATUS_FILE = join(__dirname, "..", "..", "data", "status.json");

const command: PrefixCommand = {
  name: "status",
  async execute(message: Message, args: string[]) {
    const text = args.join(" ");
    if (!text) {
      await (message.channel as TextChannel).send("Usage: `$status <text>`");
      return;
    }
    message.client.user?.setPresence({ activities: [{ name: text, state: text, type: ActivityType.Custom }] });
    writeFileSync(STATUS_FILE, JSON.stringify({ text }), "utf-8");
    await (message.channel as TextChannel).send(`Status updated to: **${text}**`);
  },
};

module.exports = command;
