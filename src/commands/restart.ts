import { Message, TextChannel } from "discord.js";
import { PrefixCommand } from "../types";
import { writeFileSync } from "fs";
import { join } from "path";

const RESTART_FILE = join(__dirname, "..", "..", "data", "restart.json");

const command: PrefixCommand = {
  name: "restart",
  async execute(message: Message) {
    writeFileSync(RESTART_FILE, JSON.stringify({ channelId: message.channel.id }));
    await (message.channel as TextChannel).send("Restarting...");
    process.exit(0);
  },
};

module.exports = command;
