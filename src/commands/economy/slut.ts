import { Message, EmbedBuilder } from "discord.js";
import { PrefixCommand } from "../../types";
import { getAccount, addCash, touchCooldown, cooldownRemaining, formatDuration, formatCurrency } from "../../utils/economy";

const COOLDOWN_MS = 20 * 60 * 1000;
const MIN_REWARD = 2000;
const MAX_REWARD = 4000;

const JOBS = [
    "gave demonoak the ball kicker 3000 treatment and repeatedly called him a bitch",
    "gave kernel a toejob",
    "sucked off null",
    "gave vfunc a blowjob",
    "shoved a traffic cone up your ass",
    "jerked off to gay furry porn",
    "gave ogisada a tummy rub",
    "were given backshots by ogisada",
    "became a stripper for the whole autovirt server",
    "sold your soul and started an OF",
    "became the resident femboy prostitute",
    "shoved an entire cucumber up keyemail's ass"
];

const command: PrefixCommand = {
  name: "slut",
  async execute(message: Message) {
    const acc = await getAccount(message.author.id);
    const remaining = cooldownRemaining(acc.lastWork, COOLDOWN_MS);
    if (remaining > 0) {
      await message.reply(`⏳ You're still on the cock. Try again in **${formatDuration(remaining)}**.`);
      return;
    }

    const reward = Math.floor(Math.random() * (MAX_REWARD - MIN_REWARD + 1)) + MIN_REWARD;
    const job = JOBS[Math.floor(Math.random() * JOBS.length)];
    await touchCooldown(message.author.id, "lastWork");
    const updated = await addCash(message.author.id, BigInt(reward));

    const embed = new EmbedBuilder()
      .setTitle("🫦 Slut")
      .setDescription(`You ${job} and earned **${formatCurrency(reward)}**!\nCash: ${formatCurrency(updated.cash)}`)
      .setColor(0x57f287);

    await message.reply({ embeds: [embed] });
  },
};

module.exports = command;
