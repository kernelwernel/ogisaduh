import { Message, EmbedBuilder } from "discord.js";
import { PrefixCommand } from "../../types";
import { getAccount, addCash, removeCash, parseAmount, formatCurrency } from "../../utils/economy";

// Members with these roles get a lower chance to win coinflips (stacks if they have more than one).
const UNLUCKY_ROLES: { id: string; penalty: number }[] = [
  { id: process.env.COINFLIP_UNLUCKY_ROLE_ID ?? "", penalty: 0.05 },
  { id: process.env.COINFLIP_UNLUCKY_ROLE_ID_2 ?? "", penalty: 0.1 },
].filter((role) => role.id);

const command: PrefixCommand = {
  name: "coinflip",
  aliases: ["cf"],
  async execute(message: Message, args: string[]) {
    const acc = await getAccount(message.author.id);
    const amount = parseAmount(args[0], acc.cash);
    const choice = args[1]?.toLowerCase();

    if (amount === null || !["heads", "tails", "h", "t"].includes(choice ?? "")) {
      await message.reply("Usage: `$coinflip <amount|all|half> <heads|tails>`");
      return;
    }
    if (amount > acc.cash) {
      await message.reply(`⚠️ You only have ${formatCurrency(acc.cash)} in cash.`);
      return;
    }

    const pick = choice!.startsWith("h") ? "heads" : "tails";
    const activeRoles = UNLUCKY_ROLES.filter((role) => message.member?.roles.cache.has(role.id));
    const totalPenalty = activeRoles.reduce((sum, role) => sum + role.penalty, 0);
    const winChance = 0.5 - totalPenalty;
    const won = Math.random() < winChance || message.author.id === process.env.OWNER_ID;
    const result = won ? pick : pick === "heads" ? "tails" : "heads";

    const updated = won ? await addCash(message.author.id, amount) : await removeCash(message.author.id, amount);

    const embed = new EmbedBuilder()
      .setTitle(`🪙 Coinflip — ${result === "heads" ? "Heads" : "Tails"}`)
      .setDescription(
        won
          ? `You called it! Won **${formatCurrency(amount)}**.\nCash: ${formatCurrency(updated.cash)}`
          : `Bad luck. Lost **${formatCurrency(amount)}**.\nCash: ${formatCurrency(updated.cash)}`
      )
      .setColor(won ? 0x57f287 : 0xff3333);

    if (totalPenalty > 0) {
      embed.setFooter({ text: `🔻 Unlucky role active: -${Math.round(totalPenalty * 100)}% win chance` });
    }

    await message.reply({ embeds: [embed] });
  },
};

module.exports = command;
