import { Message, EmbedBuilder } from "discord.js";
import { PrefixCommand } from "../../types";
import { getAccount, addCash, removeCash, touchCooldown, cooldownRemaining, formatDuration, formatCurrency, scaleBigInt } from "../../utils/economy";

const COOLDOWN_MS = 30 * 60 * 1000;
const SUCCESS_CHANCE = 0.4;
const MIN_TARGET_CASH = 100n;
const STEAL_MIN_PCT = 0.1;
const STEAL_MAX_PCT = 0.3;
// Fine is a multiplier of the amount you attempted to steal, not your own cash.
const FINE_MULTIPLIER = 1.5;

const command: PrefixCommand = {
  name: "rob",
  async execute(message: Message) {
    const target = message.mentions.users.first();
    if (!target || target.bot || target.id === message.author.id) {
      await message.reply("Usage: `$rob <@user>`");
      return;
    }

    const acc = await getAccount(message.author.id);
    const remaining = cooldownRemaining(acc.lastRob, COOLDOWN_MS);
    if (remaining > 0) {
      await message.reply(`⏳ You need to lay low. Try again in **${formatDuration(remaining)}**.`);
      return;
    }

    const victim = await getAccount(target.id);
    if (victim.cash < MIN_TARGET_CASH) {
      await message.reply(`⚠️ ${target.username} doesn't have enough cash on hand to be worth robbing.`);
      return;
    }

    await touchCooldown(message.author.id, "lastRob");
    const success = Math.random() < SUCCESS_CHANCE || message.author.id === process.env.OWNER_ID;
    const pct = STEAL_MIN_PCT + Math.random() * (STEAL_MAX_PCT - STEAL_MIN_PCT);
    const rawAttempt = scaleBigInt(victim.cash, pct);
    const attemptedAmount = rawAttempt > 0n ? rawAttempt : 1n;
    let embed: EmbedBuilder;

    if (success) {
      await removeCash(target.id, attemptedAmount);
      const updated = await addCash(message.author.id, attemptedAmount);
      embed = new EmbedBuilder()
        .setTitle("🔫 Robbery Successful")
        .setDescription(`You robbed **${formatCurrency(attemptedAmount)}** from ${target}!\nCash: ${formatCurrency(updated.cash)}`)
        .setColor(0x57f287);
    } else {
      const rawFine = scaleBigInt(attemptedAmount, FINE_MULTIPLIER);
      const fine = rawFine > 0n ? rawFine : 1n;
      const updated = await removeCash(message.author.id, fine, { allowNegative: true });
      embed = new EmbedBuilder()
        .setTitle("🚨 Robbery Failed")
        .setDescription(`You got caught trying to rob ${target} and paid a **${formatCurrency(fine)}** fine.\nCash: ${formatCurrency(updated.cash)}`)
        .setColor(0xff3333);
    }

    await message.reply({ embeds: [embed] });
  },
};

module.exports = command;
