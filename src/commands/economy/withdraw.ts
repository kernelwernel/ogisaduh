import { Message, EmbedBuilder } from "discord.js";
import { PrefixCommand } from "../../types";
import { getAccount, withdraw, parseAmount, formatCurrency } from "../../utils/economy";

const command: PrefixCommand = {
  name: "withdraw",
  aliases: ["with"],
  async execute(message: Message, args: string[]) {
    const acc = await getAccount(message.author.id);
    const amount = parseAmount(args[0], acc.bank);
    if (amount === null) {
      await message.reply("Usage: `$withdraw <amount|all|half>`");
      return;
    }
    if (amount > acc.bank) {
      await message.reply(`⚠️ You only have ${formatCurrency(acc.bank)} in the bank.`);
      return;
    }

    const { account } = await withdraw(message.author.id, amount);
    const embed = new EmbedBuilder()
      .setTitle("🏦 Withdraw")
      .setDescription(`Withdrew **${formatCurrency(amount)}** from your bank.\nCash: ${formatCurrency(account.cash)} | Bank: ${formatCurrency(account.bank)}`)
      .setColor(0x57f287);
    await message.reply({ embeds: [embed] });
  },
};

module.exports = command;
