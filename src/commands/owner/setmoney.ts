import { Message, EmbedBuilder } from "discord.js";
import { PrefixCommand } from "../../types";
import { setBalance, formatCurrency } from "../../utils/economy";

const command: PrefixCommand = {
  name: "setmoney",
  async execute(message: Message, args: string[]) {
    if (message.author.id !== process.env.OWNER_ID) return;

    const target = message.mentions.users.first();
    const amount = Math.floor(Number(args[1]));
    const field = (args[2]?.toLowerCase() === "bank" ? "bank" : "cash") as "cash" | "bank";

    if (!target || !Number.isFinite(amount) || amount < 0) {
      await message.reply("Usage: `$setmoney <@user> <amount> [cash|bank]`");
      return;
    }

    const updated = await setBalance(target.id, field, amount);

    await message.reply({
      embeds: [new EmbedBuilder()
        .setTitle("✅ Balance Set")
        .setDescription(`Set ${target}'s ${field} to **${formatCurrency(amount)}**.\nCash: ${formatCurrency(updated.cash)} | Bank: ${formatCurrency(updated.bank)}`)
        .setColor(0x5865f2)],
    });
  },
};

module.exports = command;
