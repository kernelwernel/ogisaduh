import { Message, EmbedBuilder } from "discord.js";
import { PrefixCommand } from "../../types";
import { getAccount, addCash, touchCooldown, cooldownRemaining, formatDuration, formatCurrency } from "../../utils/economy";

const COOLDOWN_MS = 24 * 60 * 60 * 1000;
const MIN_REWARD = 200;
const MAX_REWARD = 500;

const command: PrefixCommand = {
  name: "daily",
  async execute(message: Message) {
    const acc = await getAccount(message.author.id);
    const remaining = cooldownRemaining(acc.lastDaily, COOLDOWN_MS);
    if (remaining > 0) {
      await message.reply(`⏳ You already claimed your daily reward. Try again in **${formatDuration(remaining)}**.`);
      return;
    }

    const reward = Math.floor(Math.random() * (MAX_REWARD - MIN_REWARD + 1)) + MIN_REWARD;
    await touchCooldown(message.author.id, "lastDaily");
    const updated = await addCash(message.author.id, BigInt(reward));

    const embed = new EmbedBuilder()
      .setTitle("🗓️ Daily Reward")
      .setDescription(`You claimed **${formatCurrency(reward)}**!\nCash: ${formatCurrency(updated.cash)}`)
      .setColor(0x57f287);

    await message.reply({ embeds: [embed] });
  },
};

module.exports = command;
