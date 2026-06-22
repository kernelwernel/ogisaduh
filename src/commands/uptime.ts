import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { PrefixCommand } from "../types";

const command: PrefixCommand = {
  name: "uptime",
  async execute(message: Message) {
    const ms = message.client.uptime ?? 0;
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    const parts = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    const embed = new EmbedBuilder()
      .setDescription(`⏱ **Uptime:** ${parts.join(" ")}`)
      .setColor(0x5865f2);
    await (message.channel as TextChannel).send({ embeds: [embed] });
  },
};

module.exports = command;
