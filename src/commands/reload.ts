import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { PrefixCommand } from "../types";
import { writeFileSync } from "fs";
import { join } from "path";

const RESTART_FILE = join(__dirname, "..", "..", "data", "restart.json");

const command: PrefixCommand = {
  name: "restart",
  async execute(message: Message) {
    writeFileSync(RESTART_FILE, JSON.stringify({ channelId: message.channelId }), "utf-8");
    await (message.channel as TextChannel).send({
      embeds: [
        new EmbedBuilder()
          .setTitle("🛠 Restart")
          .setDescription("```> Restarting...```")
          .setColor(0xff9900),
      ],
    });
    process.exit(1);
  },
};

module.exports = command;
