import { Message, EmbedBuilder } from "discord.js";
import { PrefixCommand } from "../../types";
import { addCash, setBalance, getAccount, formatCurrency, parseWholeAmount } from "../../utils/economy";

const command: PrefixCommand = {
  name: "addmoney",
  async execute(message: Message, args: string[]) {
    if (message.author.id !== process.env.OWNER_ID) return;

    const target = message.mentions.users.first();
    const amount = parseWholeAmount(args[1]);
    const field = (args[2]?.toLowerCase() === "bank" ? "bank" : "cash") as "cash" | "bank";

    if (!target || amount === null) {
      await message.reply("Usage: `$addmoney <@user> <amount> [cash|bank]`");
      return;
    }

    const updated = field === "bank"
      ? await setBalance(target.id, "bank", (await getAccount(target.id)).bank + amount)
      : await addCash(target.id, amount);

    await message.reply({
      embeds: [new EmbedBuilder()
        .setTitle("✅ Money Added")
        .setDescription(`Added **${formatCurrency(amount)}** to ${target}'s ${field}.\nCash: ${formatCurrency(updated.cash)} | Bank: ${formatCurrency(updated.bank)}`)
        .setColor(0x57f287)],
    });
  },
};

module.exports = command;
