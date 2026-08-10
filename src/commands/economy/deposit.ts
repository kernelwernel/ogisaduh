import { Message, EmbedBuilder } from "discord.js";
import { PrefixCommand } from "../../types";
import { getAccount, deposit, parseAmount, formatCurrency } from "../../utils/economy";

const command: PrefixCommand = {
  name: "deposit",
  aliases: ["dep"],
  async execute(message: Message, args: string[]) {
    const acc = await getAccount(message.author.id);
    const amount = parseAmount(args[0], acc.cash);
    if (amount === null) {
      await message.reply("Usage: `$deposit <amount|all|half>`");
      return;
    }
    if (amount > acc.cash) {
      await message.reply(`⚠️ You only have ${formatCurrency(acc.cash)} in cash.`);
      return;
    }

    const { account } = await deposit(message.author.id, amount);
    const embed = new EmbedBuilder()
      .setTitle("🏦 Deposit")
      .setDescription(`Deposited **${formatCurrency(amount)}** into your bank.\nCash: ${formatCurrency(account.cash)} | Bank: ${formatCurrency(account.bank)}`)
      .setColor(0x57f287);
    await message.reply({ embeds: [embed] });
  },
};

module.exports = command;
