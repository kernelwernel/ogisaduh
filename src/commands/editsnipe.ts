import { Message, EmbedBuilder, TextChannel } from "discord.js";
import { PrefixCommand } from "../types";
import { editSnipes, editSnipeHistory, EditSnipeEntry } from "../snipeStore";

function buildEmbed(entry: EditSnipeEntry): EmbedBuilder {
  return new EmbedBuilder()
    .setAuthor({ name: entry.authorTag, iconURL: entry.authorAvatar })
    .setColor(0x5865f2)
    .setDescription(`Old message: \`\`\`${entry.oldContent}\`\`\`Edited message: \`\`\`${entry.newContent}\`\`\``);
}

const command: PrefixCommand = {
  name: "editsnipe",
  async execute(message: Message, args: string[]) {
    const channel = message.channel as TextChannel;

    if (args[0] !== undefined) {
      const index = Number(args[0]);
      if (isNaN(index) || index < 1) {
        await channel.send({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription("Please enter a number larger than 0!")] });
        return;
      }
      const entry = editSnipeHistory[index - 1];
      if (!entry) {
        await channel.send({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription(`Snipe #${index} does not exist! Try a number smaller or equal to ${editSnipeHistory.length}.`)] });
        return;
      }
      await channel.send({ embeds: [buildEmbed(entry)] });
      return;
    }

    const snipe = editSnipes[message.channelId];
    if (!snipe) {
      await channel.send({ embeds: [new EmbedBuilder().setColor(0xff0000).setDescription("There is nothing to snipe!")] });
      return;
    }
    await channel.send({ embeds: [buildEmbed(snipe)] });
  },
};

module.exports = command;
