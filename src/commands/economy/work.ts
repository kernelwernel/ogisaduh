import { Message, EmbedBuilder } from "discord.js";
import { PrefixCommand } from "../../types";
import { getAccount, addCash, touchCooldown, cooldownRemaining, formatDuration, formatCurrency } from "../../utils/economy";

const COOLDOWN_MS = 30 * 1000;
const MIN_REWARD = 100;
const MAX_REWARD = 200;

const JOBS = [
  "wrote a spam AC news article for ogisada and got paid in exposure",
  "sold a VMAware bypass tutorial to a random Discord kid",
  "helped Marcel rewrite a for-loop in Rust",
  "spent a shift undetected (ud) in a ranked lobby",
  "debugged AutoVirt hardening scripts for null",
  "moderated the server and confiscated three cheat configs",
  "farmed clout on a horseradishfan54 furry art commission",
  "sold Star Arthur and Maires a fake VM detection patch",
  "co-developed a VMAware feature with Requiem",
  "ran a shady eval() command for tips",
];

const command: PrefixCommand = {
  name: "work",
  async execute(message: Message) {
    const acc = await getAccount(message.author.id);
    const remaining = cooldownRemaining(acc.lastWork, COOLDOWN_MS);
    if (remaining > 0) {
      await message.reply(`⏳ You're still on the clock. Try again in **${formatDuration(remaining)}**.`);
      return;
    }

    const reward = Math.floor(Math.random() * (MAX_REWARD - MIN_REWARD + 1)) + MIN_REWARD;
    const job = JOBS[Math.floor(Math.random() * JOBS.length)];
    await touchCooldown(message.author.id, "lastWork");
    const updated = await addCash(message.author.id, reward);

    const embed = new EmbedBuilder()
      .setTitle("💼 Work")
      .setDescription(`You ${job} and earned **${formatCurrency(reward)}**!\nCash: ${formatCurrency(updated.cash)}`)
      .setColor(0x57f287);

    await message.reply({ embeds: [embed] });
  },
};

module.exports = command;
