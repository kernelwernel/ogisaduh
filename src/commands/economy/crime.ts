import { Message, EmbedBuilder } from "discord.js";
import { PrefixCommand } from "../../types";
import { getAccount, addCash, removeCash, touchCooldown, cooldownRemaining, formatDuration, formatCurrency } from "../../utils/economy";

const COOLDOWN_MS = 30 * 60 * 1000;
const SUCCESS_CHANCE = 0.65;

const MIN_REWARD = 4000;
const MAX_REWARD = 6000;

const CRIMES = [
  "sold a fake VMAware bypass to a villager and vanished before they noticed",
  "went full giga dtc trying to spoof your MAC address live on stream",
  "broke into null's AutoVirt test rig to plant a backdoor",
  "ran an illegal eval() botnet out of Marcel's Rust rewrite",
  "laundered clout through a horseradishfan54 furry art scheme",
  "impersonated ogisada and sold fake AC news subscriptions",
  "hijacked Star Arthur and Maires's ranked lobby for a cheat demo",
  "hacked the leaderboard to bump your own net worth",
  "smuggled a hypervisor patch past the server admins",
  "ran a pump-and-dump on kernel's VMAware stock",
];

const command: PrefixCommand = {
  name: "crime",
  async execute(message: Message) {
    const acc = await getAccount(message.author.id);
    const remaining = cooldownRemaining(acc.lastCrime, COOLDOWN_MS);
    if (remaining > 0) {
      await message.reply(`⏳ You need to lay low. Try again in **${formatDuration(remaining)}**.`);
      return;
    }

    await touchCooldown(message.author.id, "lastCrime");
    const crime = CRIMES[Math.floor(Math.random() * CRIMES.length)];
    const success = Math.random() < SUCCESS_CHANCE;

    let embed: EmbedBuilder;

    if (success) {
      const reward = Math.floor(Math.random() * (MAX_REWARD - MIN_REWARD + 1)) + MIN_REWARD;
      const updated = await addCash(message.author.id, reward);
      embed = new EmbedBuilder()
        .setTitle("🕶️ Crime Successful")
        .setDescription(`You ${crime} and got away with **${formatCurrency(reward)}**!\nCash: ${formatCurrency(updated.cash)}`)
        .setColor(0x57f287);
    } else {
      const fine = Math.floor(Math.random() * (MAX_REWARD - MIN_REWARD + 1)) + MIN_REWARD;
      const updated = await removeCash(message.author.id, fine, { allowNegative: true });
      embed = new EmbedBuilder()
        .setTitle("🚔 Crime Failed")
        .setDescription(`You ${crime} but got caught and paid **${formatCurrency(fine)}** in fines.\nCash: ${formatCurrency(updated.cash)}`)
        .setColor(0xff3333);
    }

    await message.reply({ embeds: [embed] });
  },
};

module.exports = command;
