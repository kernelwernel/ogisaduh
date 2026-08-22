import { Message, EmbedBuilder } from "discord.js";
import { PrefixCommand } from "../../types";
import { getLeaderboard, netWorth, formatCurrency } from "../../utils/economy";

const MEDALS = ["🥇", "🥈", "🥉"];
const COLUMNS = 3;

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
      return `${rank} **${name}**\n${formatCurrency(netWorth(entry.account))}`;
    }));

    // Split sequentially into COLUMNS side-by-side fields (ranks 1-4, 5-7, 8-10 for 10 entries)
    // rather than one long vertical list.
    const perColumn = Math.ceil(lines.length / COLUMNS);
    const fields = [];
    for (let i = 0; i < lines.length; i += perColumn) {
      fields.push({ name: "​", value: lines.slice(i, i + perColumn).join("\n\n"), inline: true });
    }

    const embed = new EmbedBuilder()
      .setTitle("🏆 Richest Players")
      .addFields(fields)
      .setColor(0xf1c40f);

    await message.reply({ embeds: [embed] });
  },
};

module.exports = command;
