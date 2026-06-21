import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { PrefixCommand } from "../types";

const command: PrefixCommand = {
  name: "ping",
  async execute(message: Message) {
    const embed = new EmbedBuilder()
      .setDescription(`🏓 **Pong!** - ${Date.now() - message.createdTimestamp}ms`)
      .setColor(0x27e462);
    await (message.channel as TextChannel).send({ embeds: [embed] });
  },
};

module.exports = command;
