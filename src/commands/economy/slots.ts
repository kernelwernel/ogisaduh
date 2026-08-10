import { Message, EmbedBuilder } from "discord.js";
import { PrefixCommand } from "../../types";
import { getAccount, addCash, parseAmount, formatCurrency } from "../../utils/economy";

// Weighted symbol pool — rarer symbols pay out more.
const SYMBOLS: { emoji: string; weight: number }[] = [
  { emoji: "🍒", weight: 40 },
  { emoji: "🍋", weight: 30 },
  { emoji: "🔔", weight: 15 },
  { emoji: "💎", weight: 10 },
  { emoji: "7️⃣", weight: 5 },
];

const PAYOUTS: Record<string, number> = {
  "🍒": 2,
  "🍋": 3,
  "🔔": 5,
  "💎": 10,
  "7️⃣": 25,
};
const TWO_MATCH_MULTIPLIER = 1.5;

function spin(): string {
  const total = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
  let roll = Math.random() * total;
  for (const s of SYMBOLS) {
    if (roll < s.weight) return s.emoji;
    roll -= s.weight;
  }
  return SYMBOLS[0].emoji;
}

const command: PrefixCommand = {
  name: "slots",
  async execute(message: Message, args: string[]) {
    const acc = await getAccount(message.author.id);
    const amount = parseAmount(args[0], acc.cash);
    if (amount === null) {
      await message.reply("Usage: `$slots <amount|all|half>`");
      return;
    }
    if (amount > acc.cash) {
      await message.reply(`⚠️ You only have ${formatCurrency(acc.cash)} in cash.`);
      return;
    }

    const reels = [spin(), spin(), spin()];
    let multiplier = 0;
    if (reels[0] === reels[1] && reels[1] === reels[2]) {
      multiplier = PAYOUTS[reels[0]];
    } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
      const matched = reels[0] === reels[1] ? reels[0] : reels[1] === reels[2] ? reels[1] : reels[0];
      multiplier = TWO_MATCH_MULTIPLIER * (PAYOUTS[matched] / 2);
    }

    const winnings = Math.floor(amount * multiplier);
    const net = winnings - amount;
    const updated = await addCash(message.author.id, net);

    let resultLine: string;
    if (net > 0) {
      resultLine = `You won **${formatCurrency(net)}**!`;
    } else if (net === 0) {
      resultLine = `Broke even.`;
    } else if (multiplier > 0) {
      resultLine = `Small match, but still lost **${formatCurrency(-net)}**.`;
    } else {
      resultLine = `No match. Lost **${formatCurrency(amount)}**.`;
    }

    const embed = new EmbedBuilder()
      .setTitle("🎰 Slots")
      .setDescription(`**[ ${reels.join(" | ")} ]**\n\n${resultLine}\nCash: ${formatCurrency(updated.cash)}`)
      .setColor(net > 0 ? 0x57f287 : 0xff3333);

    await message.reply({ embeds: [embed] });
  },
};

module.exports = command;
