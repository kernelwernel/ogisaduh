import { Message, EmbedBuilder } from "discord.js";
import { PrefixCommand } from "../../types";
import { ban, unban, banExpiry, parseDuration, DEFAULT_BAN_DURATION_MS } from "../../utils/bans";
import { formatDuration } from "../../utils/economy";

const command: PrefixCommand = {
  name: "ban",
  async execute(message: Message, args: string[]) {
    if (message.author.id !== process.env.OWNER_ID) return;

    // "$ban <@user>" with no subcommand defaults to "add"; only an explicit "remove" unbans.
    const first = args[0]?.toLowerCase();
    const explicitSubcommand = first === "add" || first === "remove";
    const subcommand = explicitSubcommand ? first : "add";
    const targetIdx = explicitSubcommand ? 1 : 0;
    const target = message.mentions.users.first()?.id ?? args[targetIdx];

    if (!target) {
      await message.reply(`Usage: \`$ban [add|remove] <@user|id> [duration]\` (defaults to add, ${formatDuration(DEFAULT_BAN_DURATION_MS)})`);
      return;
    }

    if (subcommand === "add") {
      const durationArg = args[targetIdx + 1];
      let durationMs = DEFAULT_BAN_DURATION_MS;
      if (durationArg) {
        const parsed = parseDuration(durationArg);
        if (parsed === null) {
          await message.reply("⚠️ Invalid duration — use something like `10m`, `2h`, `7d`.");
          return;
        }
        durationMs = parsed;
      }

      const wasNew = await ban(target, durationMs);
      const remaining = formatDuration(banExpiry(target)! - Date.now());
      await message.reply({
        embeds: [new EmbedBuilder()
          .setTitle(wasNew ? "🔨 User Banned" : "🔄 Ban Updated")
          .setDescription(`<@${target}> is banned from using the bot for **${remaining}**.`)
          .setColor(0xff3333)],
      });
    } else {
      const unbanned = await unban(target);
      await message.reply({
        embeds: [new EmbedBuilder()
          .setTitle(unbanned ? "✅ User Unbanned" : "⚠️ Not Banned")
          .setDescription(unbanned ? `<@${target}> is no longer banned.` : `<@${target}> is not banned.`)
          .setColor(unbanned ? 0x57f287 : 0xff9900)],
      });
    }
  },
};

module.exports = command;
