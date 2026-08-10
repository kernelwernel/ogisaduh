import { Message, EmbedBuilder } from "discord.js";
import { PrefixCommand } from "../../types";
import { getAccount, formatCurrency, netWorth } from "../../utils/economy";

const command: PrefixCommand = {
  name: "balance",
  aliases: ["bal"],
  async execute(message: Message) {
    const target = message.mentions.users.first() ?? message.author;
    const acc = await getAccount(target.id);

    const embed = new EmbedBuilder()
      .setTitle(`💰 ${target.username}'s Balance`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: "Cash", value: formatCurrency(acc.cash), inline: true },
        { name: "Bank", value: formatCurrency(acc.bank), inline: true },
        { name: "Net Worth", value: formatCurrency(netWorth(acc)), inline: true },
      )
      .setColor(0x57f287);

    await message.reply({ embeds: [embed] });
  },
};

module.exports = command;
