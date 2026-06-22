import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { PrefixCommand } from "../types";
import { snipes, snipeHistory, SnipeEntry } from "../snipeStore";

function buildEmbed(entry: SnipeEntry): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setAuthor({ name: entry.authorTag, iconURL: entry.authorAvatar })
    .setColor(0x5865f2)
    .setTimestamp(entry.createdAt);
  if (entry.content) embed.setDescription(`\`\`\`${entry.content}\`\`\``);
  if (entry.image) embed.setImage(entry.image);
  return embed;
}

const command: PrefixCommand = {
  name: "snipe",
  async execute(message: Message, args: string[]) {
    const channel = message.channel as TextChannel;

    if (args[0] !== undefined) {
      const index = Number(args[0]);
      if (isNaN(index) || index < 1) {
        await channel.send({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription("Please enter a number larger than 0!")] });
        return;
      }
      const entry = snipeHistory[index - 1];
      if (!entry) {
        await channel.send({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription(`Snipe #${index} does not exist! Try a number smaller or equal to ${snipeHistory.length}.`)] });
        return;
      }
      await channel.send({ embeds: [buildEmbed(entry)] });
      return;
    }

    const snipe = snipes[message.channelId];
    if (!snipe) {
      await channel.send({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription("There is nothing to snipe!")] });
      return;
    }
    await channel.send({ embeds: [buildEmbed(snipe)] });
  },
};

module.exports = command;
