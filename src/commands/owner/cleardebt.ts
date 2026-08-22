import { Message, EmbedBuilder } from "discord.js";
import { PrefixCommand } from "../../types";
import { clearDebt, formatCurrency } from "../../utils/economy";

const command: PrefixCommand = {
  name: "cleardebt",
  async execute(message: Message) {
    if (message.author.id !== process.env.OWNER_ID) return;

    const target = message.mentions.users.first();
    if (!target) {
      await message.reply("Usage: `$cleardebt <@user>`");
      return;
    }

    const updated = await clearDebt(target.id);

    await message.reply({
      embeds: [new EmbedBuilder()
        .setTitle("✅ Debt Cleared")
        .setDescription(`${target}'s cash is no longer negative.\nCash: ${formatCurrency(updated.cash)} | Bank: ${formatCurrency(updated.bank)}`)
        .setColor(0x57f287)],
    });
  },
};

module.exports = command;
