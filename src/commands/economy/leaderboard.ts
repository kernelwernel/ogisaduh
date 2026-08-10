import { Message, EmbedBuilder } from "discord.js";
import { PrefixCommand } from "../../types";
import { getLeaderboard, netWorth, formatCurrency } from "../../utils/economy";

const MEDALS = ["🥇", "🥈", "🥉"];

const command: PrefixCommand = {
  name: "leaderboard",
  aliases: ["lb"],
  async execute(message: Message) {
    const top = await getLeaderboard(10);
    if (top.length === 0) {
      await message.reply("No one has an account yet. Use `$daily` or `$work` to get started.");
      return;
    }

    const lines = await Promise.all(top.map(async (entry, i) => {
      const user = await message.client.users.fetch(entry.userId).catch(() => null);
      const name = user?.username ?? entry.userId;
      const rank = MEDALS[i] ?? `#${i + 1}`;
      return `${rank} **${name}** — ${formatCurrency(netWorth(entry.account))}`;
    }));

    const embed = new EmbedBuilder()
      .setTitle("🏆 Richest Players")
      .setDescription(lines.join("\n"))
      .setColor(0xf1c40f);

    await message.reply({ embeds: [embed] });
  },
};

module.exports = command;
