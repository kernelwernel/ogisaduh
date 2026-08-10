import { Message, EmbedBuilder } from "discord.js";
import { PrefixCommand } from "../../types";
import { getAccount, transfer, parseAmount, formatCurrency } from "../../utils/economy";

const command: PrefixCommand = {
  name: "pay",
  async execute(message: Message, args: string[]) {
    const target = message.mentions.users.first();
    if (!target || target.bot || target.id === message.author.id) {
      await message.reply("Usage: `$pay <@user> <amount|all|half>`");
      return;
    }

    const acc = await getAccount(message.author.id);
    const amount = parseAmount(args[1], acc.cash);
    if (amount === null) {
      await message.reply("Usage: `$pay <@user> <amount|all|half>`");
      return;
    }
    if (amount > acc.cash) {
      await message.reply(`⚠️ You only have ${formatCurrency(acc.cash)} in cash.`);
      return;
    }

    await transfer(message.author.id, target.id, amount);
    const embed = new EmbedBuilder()
      .setTitle("💸 Payment")
      .setDescription(`${message.author} paid ${target} **${formatCurrency(amount)}**.`)
      .setColor(0x57f287);
    await message.reply({ embeds: [embed] });
  },
};

module.exports = command;
