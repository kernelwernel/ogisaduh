import { Message, EmbedBuilder } from "discord.js";
import { PrefixCommand } from "../../types";
import { removeCash, formatCurrency } from "../../utils/economy";

const command: PrefixCommand = {
  name: "removemoney",
  async execute(message: Message, args: string[]) {
    if (message.author.id !== process.env.OWNER_ID) return;

    const target = message.mentions.users.first();
    const amount = Math.floor(Number(args[1]));

    if (!target || !Number.isFinite(amount) || amount <= 0) {
      await message.reply("Usage: `$removemoney <@user> <amount>`");
      return;
    }

    const updated = await removeCash(target.id, amount, { allowNegative: true });

    await message.reply({
      embeds: [new EmbedBuilder()
        .setTitle("✅ Money Removed")
        .setDescription(`Removed **${formatCurrency(amount)}** from ${target}'s cash.\nCash: ${formatCurrency(updated.cash)} | Bank: ${formatCurrency(updated.bank)}`)
        .setColor(0xff3333)],
    });
  },
};

module.exports = command;
