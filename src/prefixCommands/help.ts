import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { PrefixCommand } from "../types";

const command: PrefixCommand = {
  name: "help",
  async execute(message: Message) {
    const embed = new EmbedBuilder()
      .setTitle("Commands")
      .setDescription(
        [
          "`$ping` — check bot latency",
          "`$status <text>` — change bot status",
          "`$send <message>` — DM the target user",
          "`$help` — show this message",
        ].join("\n")
      )
      .setColor(0x5865f2);
    await (message.channel as TextChannel).send({ embeds: [embed] });
  },
};

module.exports = command;
