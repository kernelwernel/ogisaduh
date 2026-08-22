import { Message, EmbedBuilder } from "discord.js";
import { PrefixCommand } from "../../types";
import { getAccount, addCash, setSlotStreak, parseAmount, formatCurrency, scaleBigInt } from "../../utils/economy";

const BASE_WIN_CHANCE = 0.5;
// Each consecutive win adds 1% win chance to the next spin; a loss resets the streak.
const STREAK_BONUS_PER_WIN = 0.01;
const MIN_PAYOUT_MULTIPLIER = 2;
const MAX_PAYOUT_MULTIPLIER = 3;

// Purely cosmetic — the reels don't determine the outcome, just flavor the result.
const REEL_SYMBOLS = ["🍒", "🍋", "🔔", "💎", "7️⃣"];
function spinReel(): string {
  return REEL_SYMBOLS[Math.floor(Math.random() * REEL_SYMBOLS.length)];
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

    const winChance = Math.min(1, BASE_WIN_CHANCE + acc.slotStreak * STREAK_BONUS_PER_WIN);
    const won = Math.random() < winChance || message.author.id === process.env.OWNER_ID;
    const reels = [spinReel(), spinReel(), spinReel()];

    const newStreak = won ? acc.slotStreak + 1 : 0;
    await setSlotStreak(message.author.id, newStreak);

    const payoutMultiplier = MIN_PAYOUT_MULTIPLIER + Math.random() * (MAX_PAYOUT_MULTIPLIER - MIN_PAYOUT_MULTIPLIER);
    const net = won ? scaleBigInt(amount, payoutMultiplier) - amount : -amount;
    const updated = await addCash(message.author.id, net);

    const resultLine = won
      ? `You won **${formatCurrency(net)}**!`
      : `No luck. Lost **${formatCurrency(amount)}**.`;
    const streakLine = won ? `🔥 Win streak: **${newStreak}**` : `Win streak reset.`;

    const embed = new EmbedBuilder()
      .setTitle("🎰 Slots")
      .setDescription(`**[ ${reels.join(" | ")} ]**\n\n${resultLine}\n${streakLine}\nCash: ${formatCurrency(updated.cash)}`)
      .setColor(won ? 0x57f287 : 0xff3333)
      .setFooter({ text: `Win chance: ${(winChance * 100).toFixed(0)}%` });

    await message.reply({ embeds: [embed] });
  },
};

module.exports = command;
